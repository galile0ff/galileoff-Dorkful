package backend

import (
	"dorkapp/backend/models"
	"dorkapp/backend/services"
)

// Dork, geriye dönük uyumluluk için models.Dork tipini referans alır.
type Dork = models.Dork

// Template, geriye dönük uyumluluk için models.Template tipini referans alır.
type Template = models.Template

var defaultService = services.NewDorkService()

// GenerateDorks, varsayılan dork servisi üzerinden dork listesi üretir.
func GenerateDorks(target string) []Dork {
	return defaultService.GenerateDorks(target)
}
