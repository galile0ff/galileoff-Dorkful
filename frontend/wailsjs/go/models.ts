export namespace models {
	
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
	
	export class ProbeResult {
	    target: string;
	    url: string;
	    statusCode: number;
	    statusText: string;
	    responseTimeMs: number;
	    server: string;
	    contentType: string;
	    isAlive: boolean;
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
	        this.error = source["error"];
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

