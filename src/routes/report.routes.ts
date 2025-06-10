import { Router } from 'express';
import db from '../services/db.service';

const router = Router();

// Get all reports
router.get('/', (req, res) => {
	try {
		const reports = db.getAllReports();
		res.json(reports);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch reports' });
	}
});

// Get report by ID
router.get('/:id', (req, res) => {
	try {
		const report = db.getReportById(req.params.id);
		if (!report) {
			return res.status(404).json({ error: 'Report not found' });
		}
		res.json(report);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch report' });
	}
});

// Get reports by project ID
router.get('/project/:projectId', (req, res) => {
	try {
		const reports = db.getReportsByProjectId(req.params.projectId);
		res.json(reports);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch project reports' });
	}
});

// Create new report
router.post('/', (req, res) => {
	try {
		const { text, project_id } = req.body;
		if (!text || !project_id) {
			return res
				.status(400)
				.json({ error: 'Report text and project_id are required' });
		}
		const report = db.createReport({ text, project_id });
		res.status(201).json(report);
	} catch (error) {
		res.status(500).json({ error: 'Failed to create report' });
	}
});

// Update report
router.put('/:id', (req, res) => {
	try {
		const { text, project_id } = req.body;
		const report = db.updateReport(req.params.id, { text, project_id });
		if (!report) {
			return res.status(404).json({ error: 'Report not found' });
		}
		res.json(report);
	} catch (error) {
		res.status(500).json({ error: 'Failed to update report' });
	}
});

// Delete report
router.delete('/:id', (req, res) => {
	try {
		const success = db.deleteReport(req.params.id);
		if (!success) {
			return res.status(404).json({ error: 'Report not found' });
		}
		res.status(204).send();
	} catch (error) {
		res.status(500).json({ error: 'Failed to delete report' });
	}
});

export default router;
