export namespace models {
	
	export class Dork {
	    query: string;
	    description: string;
	    category: string;
	
	    static createFrom(source: any = {}) {
	        return new Dork(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.description = source["description"];
	        this.category = source["category"];
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
	export class Template {
	    Template: string;
	    Description: string;
	    Category: string;
	
	    static createFrom(source: any = {}) {
	        return new Template(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Template = source["Template"];
	        this.Description = source["Description"];
	        this.Category = source["Category"];
	    }
	}

}

