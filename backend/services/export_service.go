package services

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"dorkapp/backend/models"
)

// ExportService, dork çıktılarının dosya sistemine kaydedilmesinden sorumlu servistir.
type ExportService struct{}

// NewExportService, yeni bir ExportService örneği oluşturur.
func NewExportService() *ExportService {
	return &ExportService{}
}

// GetDesktopDir, işletim sistemi diline (Türkçe/İngilizce) ve OneDrive durumuna göre Masaüstü dizinini güvenli şekilde tespit eder.
func GetDesktopDir() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "."
	}

	candidates := []string{
		filepath.Join(homeDir, "Desktop"),
		filepath.Join(homeDir, "Masaüstü"),
		filepath.Join(homeDir, "OneDrive", "Desktop"),
		filepath.Join(homeDir, "OneDrive", "Masaüstü"),
	}

	for _, path := range candidates {
		if info, err := os.Stat(path); err == nil && info.IsDir() {
			return path
		}
	}

	return homeDir
}

// ExportJSON, verilen dork listesini kullanıcının Masaüstüne 'dorks.json' olarak kaydeder.
func (s *ExportService) ExportJSON(dorks []models.Dork) (string, error) {
	desktopDir := GetDesktopDir()

	// Varsayılan hedef: Masaüstü / dorks.json
	filePath := filepath.Join(desktopDir, "dorks.json")

	fileBytes, err := json.MarshalIndent(dorks, "", "  ")
	if err != nil {
		return "", fmt.Errorf("JSON oluşturma hatası: %w", err)
	}

	err = os.WriteFile(filePath, fileBytes, 0644)
	if err != nil {
		return "", fmt.Errorf("dosya yazma hatası: %w", err)
	}

	return filePath, nil
}
