import sqlite from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Project, ProjectResponse, RawProjectResult, Report } from '../types';

const db = new sqlite(path.resolve('./db/db.sqlite3'), {
	fileMustExist: true,
});

function query(sql: string, params?: (string | number | undefined)[]) {
	return params ? db.prepare(sql).all(...params) : db.prepare(sql).all();
}

function run(sql: string, params?: (string | number | undefined)[]) {
	return params ? db.prepare(sql).run(...params) : db.prepare(sql).run();
}

// Project CRUD operations
function getAllProjects(): ProjectResponse[] {
	const rawResults = query(
		'SELECT p.id AS id, p.name AS name, p.description AS description, r.id AS report_id, r.text AS report_text, r.projectid FROM projects p LEFT JOIN reports r ON p.id = r.projectid ORDER BY p.id, r.id',
	) as RawProjectResult[];

	// Group reports by project
	const projectsMap = new Map<string, ProjectResponse>();

	rawResults.forEach((row) => {
		if (!projectsMap.has(row.id)) {
			projectsMap.set(row.id, {
				id: row.id,
				name: row.name,
				description: row.description,
				reports: [],
			});
		}

		if (row.report_id) {
			projectsMap.get(row.id)?.reports.push({
				id: row.report_id,
				text: row.report_text!,
				projectid: row.projectid!,
			});
		}
	});

	return Array.from(projectsMap.values());
}

function getProjectById(id: string): ProjectResponse | undefined {
	const rawResults = query(
		'SELECT p.id AS id, p.name AS name, p.description AS description, r.id AS report_id, r.text AS report_text, r.projectid FROM projects p LEFT JOIN reports r ON p.id = r.projectid WHERE p.id = ? ORDER BY r.id',
		[id],
	) as RawProjectResult[];

	if (rawResults.length === 0) {
		return undefined;
	}

	const project: ProjectResponse = {
		id: rawResults[0].id,
		name: rawResults[0].name,
		description: rawResults[0].description,
		reports: [],
	};

	rawResults.forEach((row) => {
		if (row.report_id) {
			project.reports.push({
				id: row.report_id,
				text: row.report_text!,
				projectid: row.projectid!,
			});
		}
	});

	return project;
}

function createProject(project: Omit<Project, 'id'>): Project {
	const id = uuidv4();
	run('INSERT INTO projects (id, name, description) VALUES (?, ?, ?)', [
		id,
		project.name,
		project.description,
	]);
	return { id, ...project };
}

function updateProject(
	id: string,
	project: Partial<Omit<Project, 'id'>>,
): Project | undefined {
	const currentProject = getProjectById(id);
	if (!currentProject) return undefined;

	const updatedProject = { ...currentProject, ...project };
	run('UPDATE projects SET name = ?, description = ? WHERE id = ?', [
		updatedProject.name,
		updatedProject.description,
		id,
	]);
	return updatedProject;
}

function deleteProject(id: string): { success: boolean; message: string } {
	// First check if project exists
	const project = getProjectById(id);
	if (!project) {
		return {
			success: false,
			message:
				'Project does not exist, please try with a valid project id',
		};
	}

	// Delete all reports associated with the project
	run('DELETE FROM reports WHERE projectid = ?', [id]);

	// Delete the project
	const result = run('DELETE FROM projects WHERE id = ?', [id]);

	return {
		success: result.changes > 0,
		message: 'Project and its reports have been successfully deleted',
	};
}

// Report CRUD operations
function getAllReports(): Report[] {
	return query('SELECT * FROM reports') as Report[];
}

function getReportById(id: string): Report | undefined {
	const reports = query('SELECT * FROM reports WHERE id = ?', [
		id,
	]) as Report[];
	return reports[0];
}

function getReportsByProjectId(projectId: string): Report[] {
	return query('SELECT * FROM reports WHERE projectid = ?', [
		projectId,
	]) as Report[];
}

function createReport(report: Omit<Report, 'id'>): Report {
	// First check if project exists
	const project = getProjectById(report.projectid);
	if (!project) {
		throw new Error(
			'Project does not exist, please try with a valid project id',
		);
	}

	const id = uuidv4();
	run('INSERT INTO reports (id, text, projectid) VALUES (?, ?, ?)', [
		id,
		report.text,
		report.projectid,
	]);
	return { id, ...report };
}

function updateReport(
	id: string,
	report: Partial<Omit<Report, 'id'>>,
): Report | undefined {
	const currentReport = getReportById(id);
	if (!currentReport) return undefined;

	// If projectid is being updated, verify the new project exists
	if (report.projectid) {
		const project = getProjectById(report.projectid);
		if (!project) {
			throw new Error(
				'Project does not exist, please try with a valid project id',
			);
		}
	}

	const updatedReport = { ...currentReport, ...report };
	run('UPDATE reports SET text = ?, projectid = ? WHERE id = ?', [
		updatedReport.text,
		updatedReport.projectid,
		id,
	]);
	return updatedReport;
}

function deleteReport(id: string): boolean {
	const result = run('DELETE FROM reports WHERE id = ?', [id]);
	return result.changes > 0;
}

function getReportsWithFrequentWords(minOccurrences: number = 3): Report[] {
	const reports = getAllReports();

	return reports.filter((report) => {
		// Split text into words and count occurrences
		const words = report.text.toLowerCase().split(/\W+/);
		const wordCount = new Map<string, number>();

		words.forEach((word) => {
			if (word.length > 0) {
				// Skip empty strings
				wordCount.set(word, (wordCount.get(word) || 0) + 1);
			}
		});

		// Check if any word appears at least minOccurrences times
		return Array.from(wordCount.values()).some(
			(count) => count >= minOccurrences,
		);
	});
}

export default {
	query,
	run,
	getAllProjects,
	getProjectById,
	createProject,
	updateProject,
	deleteProject,
	getAllReports,
	getReportById,
	getReportsByProjectId,
	createReport,
	updateReport,
	deleteReport,
	getReportsWithFrequentWords,
};
