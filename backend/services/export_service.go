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

// ExportJSON, verilen dork listesini kullanıcının Masaüstüne 'dorks.json' olarak kaydeder.
func (s *ExportService) ExportJSON(dorks []models.Dork) (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("kullanıcı ana dizini alınamadı: %w", err)
	}

	// Varsayılan hedef: Masaüstü / dorks.json
	filePath := filepath.Join(homeDir, "Desktop", "dorks.json")

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
