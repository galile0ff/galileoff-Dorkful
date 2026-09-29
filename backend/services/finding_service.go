package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"dorkapp/backend/models"
)

// FindingService, CTI operasyonlarında elde edilen bulguları ve kanıtları yönetir.
type FindingService struct {
	mu          sync.RWMutex
	findings    []models.Finding
	storagePath string
}

// NewFindingService, kayıtlı bulguları yükleyerek servisi başlatır.
func NewFindingService() *FindingService {
	storagePath := getFindingsStoragePath()
	service := &FindingService{
		findings:    []models.Finding{},
		storagePath: storagePath,
	}

	service.loadSavedFindings()
	return service
}

// GetFindings, kayıtlı tüm bulguları döner.
func (s *FindingService) GetFindings() []models.Finding {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]models.Finding, len(s.findings))
	copy(result, s.findings)
	return result
}

// AddFinding, yeni bir kanıt/bulgu kaydı oluşturur ve diske kaydeder.
func (s *FindingService) AddFinding(target, dorkQuery, category string, severity models.FindingSeverity, evidenceURL, notes string) (models.Finding, error) {
	cleanTarget := strings.TrimSpace(target)
	cleanQuery := strings.TrimSpace(dorkQuery)

	if cleanTarget == "" {
		return models.Finding{}, errors.New("hedef domain boş olamaz")
	}

	// Varsayılan önem derecesi kontrolü
	if severity == "" {
		severity = models.SeverityMedium
	}

	finding := models.Finding{
		ID:          fmt.Sprintf("fnd_%d", time.Now().UnixNano()),
		Target:      cleanTarget,
		DorkQuery:   cleanQuery,
		Category:    strings.TrimSpace(category),
		Severity:    severity,
		EvidenceURL: strings.TrimSpace(evidenceURL),
		Notes:       strings.TrimSpace(notes),
		CreatedAt:   time.Now(),
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// En yeni bulgu en üstte listelenecek şekilde başa ekle
	s.findings = append([]models.Finding{finding}, s.findings...)
	_ = s.saveFindings()

	return finding, nil
}

// UpdateFinding, var olan bir bulgunun risk seviyesi, kanıt linki veya notunu günceller.
func (s *FindingService) UpdateFinding(id string, severity models.FindingSeverity, evidenceURL, notes string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.findings {
		if s.findings[i].ID == id {
			if severity != "" {
				s.findings[i].Severity = severity
			}
			s.findings[i].EvidenceURL = strings.TrimSpace(evidenceURL)
			s.findings[i].Notes = strings.TrimSpace(notes)
			return s.saveFindings()
		}
	}

	return errors.New("güncellenecek bulgu bulunamadı")
}

// DeleteFinding, belirtilen kimliğe sahip bulguyu siler.
func (s *FindingService) DeleteFinding(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, f := range s.findings {
		if f.ID == id {
			s.findings = append(s.findings[:i], s.findings[i+1:]...)
			return s.saveFindings()
		}
	}

	return errors.New("silinecek bulgu bulunamadı")
}

// ClearFindings, kayıtlı tüm bulguları temizler.
func (s *FindingService) ClearFindings() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.findings = []models.Finding{}
	if s.storagePath != "" {
		_ = os.Remove(s.storagePath)
	}
	return nil
}

// ExportFindingsJSON, tespit edilen bulguları detaylı bir CTI raporu olarak masaüstüne JSON formatında aktarır.
func (s *FindingService) ExportFindingsJSON() (string, error) {
	s.mu.RLock()
	findingsCopy := make([]models.Finding, len(s.findings))
	copy(findingsCopy, s.findings)
	s.mu.RUnlock()

	if len(findingsCopy) == 0 {
		return "", errors.New("dışa aktarılacak kayıtlı bulgu bulunmuyor")
	}

	desktopDir := GetDesktopDir()
	filename := fmt.Sprintf("dorkful_cti_findings_%s.json", time.Now().Format("2006-01-02_15-04-05"))
	fullPath := filepath.Join(desktopDir, filename)

	reportData := map[string]interface{}{
		"tool":        "Dorkful - galileoff CTI Tool",
		"generatedAt": time.Now().Format(time.RFC3339),
		"totalCount":  len(findingsCopy),
		"findings":    findingsCopy,
	}

	fileBytes, err := json.MarshalIndent(reportData, "", "  ")
	if err != nil {
		return "", err
	}

	err = os.WriteFile(fullPath, fileBytes, 0644)
	if err != nil {
		return "", err
	}

	return fullPath, nil
}

// getFindingsStoragePath, bulguların saklanacağı dosya yolunu belirler.
func getFindingsStoragePath() string {
	exePath, err := os.Executable()
	if err == nil {
		exeDir := filepath.Dir(exePath)
		if !strings.Contains(strings.ToLower(exePath), "temp") {
			return filepath.Join(exeDir, "findings.json")
		}
	}

	_ = os.MkdirAll(filepath.Join("build", "bin"), 0755)
	return filepath.Join("build", "bin", "findings.json")
}

// loadSavedFindings, diskte kayıtlı bulguları belleğe yükler.
func (s *FindingService) loadSavedFindings() {
	if s.storagePath == "" {
		return
	}

	fileBytes, err := os.ReadFile(s.storagePath)
	if err != nil {
		return
	}

	var loaded []models.Finding
	if err := json.Unmarshal(fileBytes, &loaded); err == nil && len(loaded) > 0 {
		s.findings = loaded
	}
}

// saveFindings, bulgu listesini diske kaydeder.
func (s *FindingService) saveFindings() error {
	if s.storagePath == "" {
		return nil
	}

	fileBytes, err := json.MarshalIndent(s.findings, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.storagePath, fileBytes, 0644)
}
