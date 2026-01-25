package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

var lastBuildTime time.Time

// RequestHandler 定义带方法限制的请求处理器
type RequestHandler struct {
	Handler func(http.ResponseWriter, *http.Request)
	Methods []string
}

// 创建全局API配置实例
var apiConfig = map[string]RequestHandler{
	"/rebuild": {
		Handler: rebuildHandler,
		Methods: []string{http.MethodGet},
	},
	"/health": {
		Handler: healthHandler,
		Methods: []string{http.MethodGet},
	},
}

// sendJSONResponse 通用JSON响应函数
func sendJSONResponse(w http.ResponseWriter, code int, data string) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(code)
	fmt.Fprint(w, data)
}

// sendJSONResponseAuto 自动将两个参数（状态和消息）转换为JSON格式的响应函数
func sendJSONResponseAuto(w http.ResponseWriter, code int, status, message string) {
	response := map[string]string{
		"status":  status,
		"message": message,
	}
	jsonData, err := json.Marshal(response)
	if err != nil {
		// 如果JSON序列化失败，返回错误
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(jsonData)
}

func rebuildHandler(w http.ResponseWriter, r *http.Request) {
	// 检查是否在短时间内重复请求
	if time.Since(lastBuildTime) < 5*time.Second {
		sendJSONResponseAuto(w, http.StatusTooManyRequests, "error", "Build in progress or too frequent")
		return
	}

	lastBuildTime = time.Now()

	_, err := executeBuild()

	if err != nil {
		log.Printf("Build failed: %v", err)
		sendJSONResponseAuto(w, http.StatusInternalServerError, "error", "Build failed")
		return
	}

	log.Println("Build completed successfully")
	sendJSONResponseAuto(w, http.StatusOK, "success", "Build completed successfully")
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	sendJSONResponse(w, http.StatusOK, `{"status":"OK","timestamp":"`+time.Now().Format(time.RFC3339)+`"}`)
}

// copyDir 递归复制目录
func copyDir(src, dst string) error {
	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	// 确保目标目录存在
	if err := os.MkdirAll(dst, 0755); err != nil {
		return err
	}

	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())

		if entry.IsDir() {
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			info, err := entry.Info()
			if err != nil {
				return err
			}

			// 复制文件
			srcFile, err := os.Open(srcPath)
			if err != nil {
				return err
			}

			dstFile, err := os.Create(dstPath)
			if err != nil {
				srcFile.Close() // 确保源文件关闭
				return err
			}

			// 复制文件内容
			if _, err := io.Copy(dstFile, srcFile); err != nil {
				srcFile.Close()
				dstFile.Close()
				return err
			}

			// 关闭文件
			srcFile.Close()
			dstFile.Close()

			// 设置目标文件的时间戳
			if err := os.Chtimes(dstPath, info.ModTime(), info.ModTime()); err != nil {
				return err
			}
		}
	}
	return nil
}

// cacheMutex 用于保护缓存目录的并发访问
var cacheMutex sync.RWMutex

// executeBuild 执行构建的核心逻辑
func executeBuild() ([]byte, error) {
	// 从环境变量获取构建参数
	buildArgs := os.Getenv("BUILD_ARGS")
	var args []string

	if buildArgs != "" {
		// 将逗号分隔的参数字符串转换为参数数组
		args = strings.Split(buildArgs, ",")
	} else {
		// 默认参数
		args = []string{"quartz", "build"}
	}

	// 显示实际执行的命令
	command := "npx " + strings.Join(args, " ")
	log.Println("Executing:", command)

	// 先将public目录内容复制到public-cache目录
	publicCacheDir := "public-cache"

	// 加锁以确保构建过程中不会影响文件服务
	cacheMutex.Lock()
	defer cacheMutex.Unlock()

	// 如果public目录存在，则复制到缓存目录
	if _, err := os.Stat("public"); err == nil {
		// 清空或创建缓存目录
		os.RemoveAll(publicCacheDir)
		os.MkdirAll(publicCacheDir, 0755)

		// 复制public目录内容到缓存目录
		if err := copyDir("public", publicCacheDir); err != nil {
			log.Printf("Failed to copy public directory to cache: %v", err)
		} else {
			log.Println("Successfully copied public directory to cache")
		}
	} else {
		// 如果public目录不存在，至少创建一个空的缓存目录
		os.MkdirAll(publicCacheDir, 0755)
		log.Println("Public directory does not exist, created empty cache directory")
	}

	// 执行构建命令
	cmd := exec.Command("npx", args...)
	cmd.Dir = "." // 设置工作目录为当前目录

	// 执行命令并获取输出
	output, err := cmd.CombinedOutput()

	// 记录构建输出到日志（但不返回给客户端）
	if len(output) > 0 {
		log.Printf("Build output: %s", string(output))
	}

	// 构建成功后，将public目录内容复制回缓存目录
	if err == nil {
		if _, err := os.Stat("public"); err == nil {
			// 清空缓存目录
			os.RemoveAll(publicCacheDir)
			os.MkdirAll(publicCacheDir, 0755)

			// 将最新的public目录内容复制到缓存目录
			if copyErr := copyDir("public", publicCacheDir); copyErr != nil {
				log.Printf("Failed to update cache after build: %v", copyErr)
			} else {
				log.Println("Successfully updated cache after build")
			}
		}
	} else {
		log.Printf("Build failed: %v", err)
	}

	return output, err
}

func serveQuartzFile(w http.ResponseWriter, r *http.Request) {
	// 使用缓存目录作为根目录
	rootDir := "public-cache"

	// 清理请求路径
	path := r.URL.Path

	// 如果请求的是根路径，返回index.html
	if path == "/" {
		path = "/index.html"
	}

	// 构建完整的文件路径
	fullPath := filepath.Join(rootDir, filepath.Clean(path))

	// 按照nginx的try_files逻辑顺序尝试
	tryPaths := []string{
		fullPath,           // $uri
		fullPath + ".html", // $uri.html
	}

	// 尝试将路径作为目录处理（在路径末尾添加斜杠并查找index.html）
	// 这符合nginx的 $uri/ 逻辑
	tryPaths = append(tryPaths, filepath.Join(fullPath, "index.html"))

	var filePath string
	var found bool

	// 按顺序尝试所有可能的路径
	for _, tryPath := range tryPaths {
		if info, err := os.Stat(tryPath); err == nil && !info.IsDir() {
			filePath = tryPath
			found = true
			break
		}
	}

	// 如果找到了文件，提供文件
	if found {
		http.ServeFile(w, r, filePath)
		return
	}

	// 如果没有找到文件，返回404并尝试提供404.html
	notFoundPath := filepath.Join(rootDir, "404.html")
	if _, err := os.Stat(notFoundPath); err == nil {
		w.WriteHeader(http.StatusNotFound)
		http.ServeFile(w, r, notFoundPath)
		return
	}

	// 如果404.html也不存在，返回简单的404文本
	w.WriteHeader(http.StatusNotFound)
	fmt.Fprint(w, "404 page not found")
}

// routeHandler 统一的路由处理器
func routeHandler(w http.ResponseWriter, r *http.Request) {
	// 检查是否是API请求
	pathWithoutQuery := strings.Split(r.URL.Path, "?")[0]
	handler, exists := apiConfig[pathWithoutQuery]

	if exists {
		// 验证请求方法
		isAllowed := false
		for _, allowedMethod := range handler.Methods {
			if r.Method == allowedMethod {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			allowedMethodsStr := strings.Join(handler.Methods, ", ")
			w.Header().Set("Allow", allowedMethodsStr)
			sendJSONResponseAuto(w, http.StatusMethodNotAllowed, "error", "Method not allowed, allowed methods: "+allowedMethodsStr)
			return
		}

		// 调用处理器
		handler.Handler(w, r)
		return
	}

	// 否则使用Quartz静态文件服务逻辑
	serveQuartzFile(w, r)
}

func main() {
	// 注册统一的路由处理器
	http.HandleFunc("/", routeHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 执行构建
	_, err := executeBuild()
	if err != nil {
		log.Fatalf("Build failed: %v", err)
	}

	log.Printf("Starting server on port %s", port)
	log.Printf("url: http://localhost:%s/", port)

	// 启动HTTP服务器
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}
