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

// WorkspaceService, hedef profillerini (kurum, ASN, domain, IP bloğu) yönetir ve diske kaydeder.
type WorkspaceService struct {
	mu                sync.RWMutex
	workspaces        []models.Workspace
	activeWorkspaceID string
	storagePath       string
}

// NewWorkspaceService, kayıtlı çalışma alanlarını yükleyerek servisi başlatır.
func NewWorkspaceService() *WorkspaceService {
	storagePath := getWorkspacesStoragePath()
	service := &WorkspaceService{
		workspaces:  []models.Workspace{},
		storagePath: storagePath,
	}

	service.loadSavedWorkspaces()
	return service
}

// GetWorkspaces, kayıtlı tüm çalışma alanlarını döner.
func (s *WorkspaceService) GetWorkspaces() []models.Workspace {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]models.Workspace, len(s.workspaces))
	copy(result, s.workspaces)
	return result
}

// CreateWorkspace, yeni bir hedef çalışma alanı oluşturur ve diske kaydeder.
func (s *WorkspaceService) CreateWorkspace(name, domain, company, asn, ipRange, githubOrg string) (models.Workspace, error) {
	cleanName := strings.TrimSpace(name)
	cleanDomain := CleanTargetDomain(domain)

	if cleanName == "" {
		if cleanDomain != "" {
			cleanName = cleanDomain
		} else {
			return models.Workspace{}, errors.New("çalışma alanı adı veya hedef domain boş olamaz")
		}
	}

	cleanCompany := strings.TrimSpace(company)
	if cleanCompany == "" {
		cleanCompany = cleanName
	}

	ws := models.Workspace{
		ID:        fmt.Sprintf("ws_%d", time.Now().UnixNano()),
		Name:      cleanName,
		Domain:    cleanDomain,
		Company:   cleanCompany,
		ASN:       strings.TrimSpace(asn),
		IPRange:   strings.TrimSpace(ipRange),
		GithubOrg: strings.TrimSpace(githubOrg),
		CreatedAt: time.Now(),
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.workspaces = append([]models.Workspace{ws}, s.workspaces...)
	s.activeWorkspaceID = ws.ID
	_ = s.saveWorkspaces()

	return ws, nil
}

// UpdateWorkspace, mevcut bir çalışma alanını günceller.
func (s *WorkspaceService) UpdateWorkspace(id, name, domain, company, asn, ipRange, githubOrg string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.workspaces {
		if s.workspaces[i].ID == id {
			if strings.TrimSpace(name) != "" {
				s.workspaces[i].Name = strings.TrimSpace(name)
			}
			if strings.TrimSpace(domain) != "" {
				s.workspaces[i].Domain = CleanTargetDomain(domain)
			}
			s.workspaces[i].Company = strings.TrimSpace(company)
			s.workspaces[i].ASN = strings.TrimSpace(asn)
			s.workspaces[i].IPRange = strings.TrimSpace(ipRange)
			s.workspaces[i].GithubOrg = strings.TrimSpace(githubOrg)

			return s.saveWorkspaces()
		}
	}

	return errors.New("güncellenecek çalışma alanı bulunamadı")
}

// DeleteWorkspace, belirtilen kimlikteki çalışma alanını siler.
func (s *WorkspaceService) DeleteWorkspace(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, ws := range s.workspaces {
		if ws.ID == id {
			s.workspaces = append(s.workspaces[:i], s.workspaces[i+1:]...)
			if s.activeWorkspaceID == id {
				if len(s.workspaces) > 0 {
					s.activeWorkspaceID = s.workspaces[0].ID
				} else {
					s.activeWorkspaceID = ""
				}
			}
			return s.saveWorkspaces()
		}
	}

	return errors.New("silinecek çalışma alanı bulunamadı")
}

// GetActiveWorkspaceID, şu anda aktif olan çalışma alanı kimliğini döner.
func (s *WorkspaceService) GetActiveWorkspaceID() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.activeWorkspaceID
}

// SetActiveWorkspaceID, aktif çalışma alanını belirler.
func (s *WorkspaceService) SetActiveWorkspaceID(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, ws := range s.workspaces {
		if ws.ID == id {
			s.activeWorkspaceID = id
			return s.saveWorkspaces()
		}
	}

	return errors.New("çalışma alanı bulunamadı")
}

// getWorkspacesStoragePath, çalışma alanlarının saklanacağı yerel dosya yolunu belirler.
func getWorkspacesStoragePath() string {
	exePath, err := os.Executable()
	if err == nil {
		exeDir := filepath.Dir(exePath)
		if !strings.Contains(strings.ToLower(exePath), "temp") {
			return filepath.Join(exeDir, "workspaces.json")
		}
	}

	_ = os.MkdirAll(filepath.Join("build", "bin"), 0755)
	return filepath.Join("build", "bin", "workspaces.json")
}

// WorkspaceSaveData, dosya kayıt formatı
type WorkspaceSaveData struct {
	ActiveID   string             `json:"activeId"`
	Workspaces []models.Workspace `json:"workspaces"`
}

// loadSavedWorkspaces, diskteki çalışma alanlarını yükler.
func (s *WorkspaceService) loadSavedWorkspaces() {
	if s.storagePath == "" {
		return
	}

	fileBytes, err := os.ReadFile(s.storagePath)
	if err != nil {
		return
	}

	var data WorkspaceSaveData
	if err := json.Unmarshal(fileBytes, &data); err == nil {
		s.workspaces = data.Workspaces
		s.activeWorkspaceID = data.ActiveID
		return
	}

	// Eski format fallback
	var list []models.Workspace
	if err := json.Unmarshal(fileBytes, &list); err == nil && len(list) > 0 {
		s.workspaces = list
		s.activeWorkspaceID = list[0].ID
	}
}

// saveWorkspaces, tüm çalışma alanlarını ve aktif seçimi diske kaydeder.
func (s *WorkspaceService) saveWorkspaces() error {
	if s.storagePath == "" {
		return nil
	}

	data := WorkspaceSaveData{
		ActiveID:   s.activeWorkspaceID,
		Workspaces: s.workspaces,
	}

	fileBytes, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.storagePath, fileBytes, 0644)
}
