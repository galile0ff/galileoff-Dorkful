export namespace models {
	
	export class APIKeyTestResult {
	    engine: string;
	    success: boolean;
	    message: string;
	    details: string;
	
	    static createFrom(source: any = {}) {
	        return new APIKeyTestResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.engine = source["engine"];
	        this.success = source["success"];
	        this.message = source["message"];
	        this.details = source["details"];
	    }
	}
	export class AppSettings {
	    shodanKey: string;
	    githubToken: string;
	    censysId: string;
	    censysSecret: string;
	    autoProbeTarget: boolean;
	    probeTimeoutSec: number;
	    customUserAgent: string;
	    defaultSearchEngine: string;
	
	    static createFrom(source: any = {}) {
	        return new AppSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.shodanKey = source["shodanKey"];
	        this.githubToken = source["githubToken"];
	        this.censysId = source["censysId"];
	        this.censysSecret = source["censysSecret"];
	        this.autoProbeTarget = source["autoProbeTarget"];
	        this.probeTimeoutSec = source["probeTimeoutSec"];
	        this.customUserAgent = source["customUserAgent"];
	        this.defaultSearchEngine = source["defaultSearchEngine"];
	    }
	}
	export class CensysHostItem {
	    ip: string;
	    name: string;
	    services: string[];
	    asn: string;
	    asName: string;
	    country: string;
	    countryCode: string;
	    lastUpdated: string;
	    url?: string;
	
	    static createFrom(source: any = {}) {
	        return new CensysHostItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.name = source["name"];
	        this.services = source["services"];
	        this.asn = source["asn"];
	        this.asName = source["asName"];
	        this.country = source["country"];
	        this.countryCode = source["countryCode"];
	        this.lastUpdated = source["lastUpdated"];
	        this.url = source["url"];
	    }
	}
	export class CoHostedDomainItem {
	    domain: string;
	    resolvedIp: string;
	    source: string;
	
	    static createFrom(source: any = {}) {
	        return new CoHostedDomainItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.domain = source["domain"];
	        this.resolvedIp = source["resolvedIp"];
	        this.source = source["source"];
	    }
	}
	export class NetworkEdge {
	    source: string;
	    target: string;
	    type: string;
	    label: string;
	
	    static createFrom(source: any = {}) {
	        return new NetworkEdge(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.source = source["source"];
	        this.target = source["target"];
	        this.type = source["type"];
	        this.label = source["label"];
	    }
	}
	export class NetworkNode {
	    id: string;
	    label: string;
	    type: string;
	    category: string;
	    details: string;
	
	    static createFrom(source: any = {}) {
	        return new NetworkNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.label = source["label"];
	        this.type = source["type"];
	        this.category = source["category"];
	        this.details = source["details"];
	    }
	}
	export class DNSRecordItem {
	    type: string;
	    value: string;
	    priority: number;
	
	    static createFrom(source: any = {}) {
	        return new DNSRecordItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.value = source["value"];
	        this.priority = source["priority"];
	    }
	}
	export class DNSMapResult {
	    target: string;
	    resolvedIp: string;
	    records: DNSRecordItem[];
	    coHostedDomains: CoHostedDomainItem[];
	    nodes: NetworkNode[];
	    edges: NetworkEdge[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new DNSMapResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target = source["target"];
	        this.resolvedIp = source["resolvedIp"];
	        this.records = this.convertValues(source["records"], DNSRecordItem);
	        this.coHostedDomains = this.convertValues(source["coHostedDomains"], CoHostedDomainItem);
	        this.nodes = this.convertValues(source["nodes"], NetworkNode);
	        this.edges = this.convertValues(source["edges"], NetworkEdge);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class MitreAttack {
	    techniqueId: string;
	    technique: string;
	    tacticId: string;
	    tactic: string;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new MitreAttack(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.techniqueId = source["techniqueId"];
	        this.technique = source["technique"];
	        this.tacticId = source["tacticId"];
	        this.tactic = source["tactic"];
	        this.url = source["url"];
	    }
	}
	export class Dork {
	    query: string;
	    description: string;
	    category: string;
	    engine?: string;
	    searchUrl?: string;
	    techTag?: string;
	    mitre?: MitreAttack;
	
	    static createFrom(source: any = {}) {
	        return new Dork(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.description = source["description"];
	        this.category = source["category"];
	        this.engine = source["engine"];
	        this.searchUrl = source["searchUrl"];
	        this.techTag = source["techTag"];
	        this.mitre = this.convertValues(source["mitre"], MitreAttack);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Finding {
	    id: string;
	    target: string;
	    dorkQuery: string;
	    category: string;
	    severity: string;
	    evidenceUrl: string;
	    notes: string;
	    mitre?: MitreAttack;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Finding(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.target = source["target"];
	        this.dorkQuery = source["dorkQuery"];
	        this.category = source["category"];
	        this.severity = source["severity"];
	        this.evidenceUrl = source["evidenceUrl"];
	        this.notes = source["notes"];
	        this.mitre = this.convertValues(source["mitre"], MitreAttack);
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GitHubLeakResult {
	    name: string;
	    path: string;
	    repoName: string;
	    repoUrl: string;
	    htmlUrl: string;
	    query: string;
	    description: string;
	    sha: string;
	
	    static createFrom(source: any = {}) {
	        return new GitHubLeakResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.repoName = source["repoName"];
	        this.repoUrl = source["repoUrl"];
	        this.htmlUrl = source["htmlUrl"];
	        this.query = source["query"];
	        this.description = source["description"];
	        this.sha = source["sha"];
	    }
	}
	export class JSSecretItem {
	    type: string;
	    value: string;
	    rawMatch: string;
	    sourceUrl: string;
	    severity: string;
	
	    static createFrom(source: any = {}) {
	        return new JSSecretItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.value = source["value"];
	        this.rawMatch = source["rawMatch"];
	        this.sourceUrl = source["sourceUrl"];
	        this.severity = source["severity"];
	    }
	}
	export class JSEndpointItem {
	    endpoint: string;
	    sourceUrl: string;
	    method: string;
	    snippet: string;
	
	    static createFrom(source: any = {}) {
	        return new JSEndpointItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.endpoint = source["endpoint"];
	        this.sourceUrl = source["sourceUrl"];
	        this.method = source["method"];
	        this.snippet = source["snippet"];
	    }
	}
	export class JSSourceScript {
	    url: string;
	    statusCode: number;
	    byteSize: number;
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new JSSourceScript(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.statusCode = source["statusCode"];
	        this.byteSize = source["byteSize"];
	        this.error = source["error"];
	    }
	}
	export class JSAnalysisResult {
	    target: string;
	    totalScripts: number;
	    scannedScripts: number;
	    scripts: JSSourceScript[];
	    endpoints: JSEndpointItem[];
	    secrets: JSSecretItem[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new JSAnalysisResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target = source["target"];
	        this.totalScripts = source["totalScripts"];
	        this.scannedScripts = source["scannedScripts"];
	        this.scripts = this.convertValues(source["scripts"], JSSourceScript);
	        this.endpoints = this.convertValues(source["endpoints"], JSEndpointItem);
	        this.secrets = this.convertValues(source["secrets"], JSSecretItem);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	
	
	export class TechnologyItem {
	    name: string;
	    category: string;
	    version: string;
	    confidence: string;
	
	    static createFrom(source: any = {}) {
	        return new TechnologyItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.category = source["category"];
	        this.version = source["version"];
	        this.confidence = source["confidence"];
	    }
	}
	export class ProbeResult {
	    target: string;
	    url: string;
	    statusCode: number;
	    statusText: string;
	    responseTimeMs: number;
	    server: string;
	    contentType: string;
	    isAlive: boolean;
	    technologies: TechnologyItem[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new ProbeResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target = source["target"];
	        this.url = source["url"];
	        this.statusCode = source["statusCode"];
	        this.statusText = source["statusText"];
	        this.responseTimeMs = source["responseTimeMs"];
	        this.server = source["server"];
	        this.contentType = source["contentType"];
	        this.isAlive = source["isAlive"];
	        this.technologies = this.convertValues(source["technologies"], TechnologyItem);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ShodanHostItem {
	    ip: string;
	    ports: number[];
	    vulns: string[];
	    hostnames: string[];
	    tags: string[];
	    org: string;
	    isp: string;
	    asn: string;
	    os: string;
	    isKeyless: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ShodanHostItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.ports = source["ports"];
	        this.vulns = source["vulns"];
	        this.hostnames = source["hostnames"];
	        this.tags = source["tags"];
	        this.org = source["org"];
	        this.isp = source["isp"];
	        this.asn = source["asn"];
	        this.os = source["os"];
	        this.isKeyless = source["isKeyless"];
	    }
	}
	export class ShodanInternetDBResult {
	    ip: string;
	    ports: number[];
	    vulns: string[];
	    hostnames: string[];
	    tags: string[];
	    cpes: string[];
	
	    static createFrom(source: any = {}) {
	        return new ShodanInternetDBResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.ports = source["ports"];
	        this.vulns = source["vulns"];
	        this.hostnames = source["hostnames"];
	        this.tags = source["tags"];
	        this.cpes = source["cpes"];
	    }
	}
	export class SubdomainResult {
	    subdomain: string;
	    loggedAt: string;
	    issuer: string;
	
	    static createFrom(source: any = {}) {
	        return new SubdomainResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.subdomain = source["subdomain"];
	        this.loggedAt = source["loggedAt"];
	        this.issuer = source["issuer"];
	    }
	}
	
	export class Template {
	    template: string;
	    description: string;
	    category: string;
	    mitre?: MitreAttack;
	
	    static createFrom(source: any = {}) {
	        return new Template(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.template = source["template"];
	        this.description = source["description"];
	        this.category = source["category"];
	        this.mitre = this.convertValues(source["mitre"], MitreAttack);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class WaybackResult {
	    url: string;
	    timestamp: string;
	    mimeType: string;
	    status: string;
	    snapshotUrl: string;
	    year: string;
	
	    static createFrom(source: any = {}) {
	        return new WaybackResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.timestamp = source["timestamp"];
	        this.mimeType = source["mimeType"];
	        this.status = source["status"];
	        this.snapshotUrl = source["snapshotUrl"];
	        this.year = source["year"];
	    }
	}
	export class Workspace {
	    id: string;
	    name: string;
	    domain: string;
	    company: string;
	    asn: string;
	    ipRange: string;
	    githubOrg: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Workspace(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.domain = source["domain"];
	        this.company = source["company"];
	        this.asn = source["asn"];
	        this.ipRange = source["ipRange"];
	        this.githubOrg = source["githubOrg"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

