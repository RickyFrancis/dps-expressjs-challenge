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

function getProjectById(id: string): Project | undefined {
	const projects = query(
		'SELECT p.id AS project_id, p.name AS project_name, p.description AS project_description, r.id AS report_id, r.text AS report_text FROM projects p LEFT JOIN reports r ON p.id = r.projectid WHERE p.id = ? ORDER BY p.id, r.id',
		[id],
	) as Project[];
	return projects[0];
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

function deleteProject(id: string): boolean {
	const result = run('DELETE FROM projects WHERE id = ?', [id]);
	return result.changes > 0;
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
};
