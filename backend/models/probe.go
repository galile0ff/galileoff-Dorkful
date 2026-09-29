package models

// ProbeResult, bir hedef web varlığının HTTP canlılık ve durum kontrolü sonucunu temsil eder.
type ProbeResult struct {
	Target         string `json:"target"`
	URL            string `json:"url"`
	StatusCode     int    `json:"statusCode"`
	StatusText     string `json:"statusText"`
	ResponseTimeMs int64  `json:"responseTimeMs"`
	Server         string `json:"server"`
	ContentType    string `json:"contentType"`
	IsAlive        bool   `json:"isAlive"`
	Error          string `json:"error,omitempty"`
}
