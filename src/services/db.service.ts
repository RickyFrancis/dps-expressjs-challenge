import sqlite from 'better-sqlite3';
import path from 'path';
import { Project } from '../types';

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

export default {
	query,
	run,
	getAllProjects,
	getProjectById,
	createProject,
	updateProject,
	deleteProject,
};
