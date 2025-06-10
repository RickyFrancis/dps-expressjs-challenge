import sqlite from 'better-sqlite3';
import path from 'path';
import { Project, Report } from '../types';

const db = new sqlite(path.resolve('./db/db.sqlite3'), {
	fileMustExist: true,
});

function query(
	sql: string,
	params?: { [key: string]: string | number | undefined },
) {
	return params ? db.prepare(sql).all(params) : db.prepare(sql).all();
}

function run(
	sql: string,
	params?: { [key: string]: string | number | undefined },
) {
	return params ? db.prepare(sql).run(params) : db.prepare(sql).run();
}

// Project CRUD operations
function getAllProjects(): Project[] {
	return query('SELECT * FROM projects') as Project[];
}

function getProjectById(id: string): Project | undefined {
	const projects = query('SELECT * FROM projects WHERE id = ?', {
		id,
	}) as Project[];
	return projects[0];
}

function createProject(project: Omit<Project, 'id'>): Project {
	const id = crypto.randomUUID();
	run('INSERT INTO projects (id, name, description) VALUES (?, ?, ?)', {
		id,
		name: project.name,
		description: project.description,
	});
	return { id, ...project };
}

function updateProject(
	id: string,
	project: Partial<Omit<Project, 'id'>>,
): Project | undefined {
	const currentProject = getProjectById(id);
	if (!currentProject) return undefined;

	const updatedProject = { ...currentProject, ...project };
	run('UPDATE projects SET name = ?, description = ? WHERE id = ?', {
		name: updatedProject.name,
		description: updatedProject.description,
		id,
	});
	return updatedProject;
}

function deleteProject(id: string): boolean {
	const result = run('DELETE FROM projects WHERE id = ?', { id });
	return result.changes > 0;
}

// Report CRUD operations
function getAllReports(): Report[] {
	return query('SELECT * FROM reports') as Report[];
}

function getReportById(id: string): Report | undefined {
	const reports = query('SELECT * FROM reports WHERE id = ?', {
		id,
	}) as Report[];
	return reports[0];
}

function getReportsByProjectId(projectId: string): Report[] {
	return query('SELECT * FROM reports WHERE project_id = ?', {
		projectId,
	}) as Report[];
}

function createReport(report: Omit<Report, 'id'>): Report {
	const id = crypto.randomUUID();
	run('INSERT INTO reports (id, text, project_id) VALUES (?, ?, ?)', {
		id,
		text: report.text,
		project_id: report.project_id,
	});
	return { id, ...report };
}

function updateReport(
	id: string,
	report: Partial<Omit<Report, 'id'>>,
): Report | undefined {
	const currentReport = getReportById(id);
	if (!currentReport) return undefined;

	const updatedReport = { ...currentReport, ...report };
	run('UPDATE reports SET text = ?, project_id = ? WHERE id = ?', {
		text: updatedReport.text,
		project_id: updatedReport.project_id,
		id,
	});
	return updatedReport;
}

function deleteReport(id: string): boolean {
	const result = run('DELETE FROM reports WHERE id = ?', { id });
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
