import { Router } from 'express';
import db from '../services/db.service';

const router = Router();

// Get all projects with their reports
router.get('/', (req, res) => {
	try {
		const projects = db.getAllProjects();
		res.json(projects);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch projects' });
	}
});

// Get project by ID with its reports
router.get('/:id', (req, res) => {
	try {
		const project = db.getProjectById(req.params.id);
		if (!project) {
			return res.status(404).json({ error: 'Project not found' });
		}
		const projectWithReports = {
			...project,
			reports: db.getReportsByProjectId(project.id),
		};
		res.json(projectWithReports);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch project' });
	}
});

// Create new project
router.post('/', (req, res) => {
	try {
		const { name, description } = req.body;
		if (!name) {
			return res.status(400).json({ error: 'Project name is required' });
		}
		const project = db.createProject({ name, description });
		res.status(201).json(project);
	} catch (error) {
		res.status(500).json({ error: 'Failed to create project' });
	}
});

// Update project
router.put('/:id', (req, res) => {
	try {
		const { name, description } = req.body;
		const project = db.updateProject(req.params.id, { name, description });
		if (!project) {
			return res.status(404).json({ error: 'Project not found' });
		}
		res.json(project);
	} catch (error) {
		res.status(500).json({ error: 'Failed to update project' });
	}
});

// Delete project
router.delete('/:id', (req, res) => {
	try {
		const result = db.deleteProject(req.params.id);
		if (!result.success) {
			return res.status(404).json({ error: result.message });
		}
		res.status(200).json({ message: result.message });
	} catch (error) {
		res.status(500).json({ error: 'Failed to delete project' });
	}
});

export default router;
