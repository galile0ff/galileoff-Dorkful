package main

import (
	"context"
	"dorkapp/backend"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// GenerateDorks returns a list of generated dorks for a target
func (a *App) GenerateDorks(target string) []backend.Dork {
	return backend.GenerateDorks(target)
}

// ExportJSON exports the generated dorks to a specified location (defaulting to Desktop or app dir)
func (a *App) ExportJSON(dorks []backend.Dork) (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	
	// Default to Desktop
	filePath := filepath.Join(homeDir, "Desktop", "dorks.json")
	
	fileBytes, err := json.MarshalIndent(dorks, "", "  ")
	if err != nil {
		return "", fmt.Errorf("JSON oluşturma hatası: %v", err)
	}

	err = os.WriteFile(filePath, fileBytes, 0644)
	if err != nil {
		return "", fmt.Errorf("Dosya yazma hatası: %v", err)
	}

	return filePath, nil
}
