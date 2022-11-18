package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	backend "zo-backend/server"
)

func openInBrowser(path string) error {
	var args []string
	switch runtime.GOOS {
	case "darwin":
		args = []string{"open", path}
	case "windows":
		args = []string{"cmd", "/c", "start", path}
	default:
		args = []string{"xdg-open", path}
	}
	cmd := exec.Command(args[0], args[1:]...)
	err := cmd.Run()
	if err != nil {
		return err
	}

	return nil
}

func main() {
	errChan := make(chan error)
	// exit the program on ps kill, an interrupt and Ctrl+C...
	exit := make(chan os.Signal, 1)
	signal.Notify(exit, os.Interrupt, syscall.SIGQUIT, os.Kill, syscall.SIGTERM)

	go func() {
		port, router, err := backend.NewRouter()
		if err != nil {
			errChan <- err
			return
		}

		err = openInBrowser("../frontend/pages/index.html")
		if err != nil {
			err = fmt.Errorf("openinbrowser error: %v", err)
			errChan <- err
			return
		}

		log.Println("the server is active")
		err = http.ListenAndServe(":"+port, router)
		if err != nil {
			err = fmt.Errorf("the server is inactive due to an error\nlistening server error: %+v\n", err)
			errChan <- err
			return
		}
	}()

	for {
		select {
		case <-exit:
			log.Println("the server is inactive")
			time.Sleep(time.Second)
			return
		case err := <-errChan:
			log.Printf("got an error: %s\n", err.Error())
			<-exit
			return
		}
	}
}
