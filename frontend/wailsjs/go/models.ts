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

