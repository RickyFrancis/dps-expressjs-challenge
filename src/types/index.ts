export interface Project {
	id: string;
	name: string;
	description: string;
}

export interface Report {
	id: string;
	text: string;
	projectid: string;
}

export interface ProjectResponse {
	id: string;
	name: string;
	description: string;
	reports: Report[];
}

export interface RawProjectResult {
	id: string;
	name: string;
	description: string;
	report_id: string | null;
	report_text: string | null;
	projectid: string | null;
}
