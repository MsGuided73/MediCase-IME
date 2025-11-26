# Sherlock Health API Documentation

## Overview

The Sherlock Health API provides comprehensive medical symptom tracking, AI-powered diagnosis, and health management capabilities. This RESTful API is built with Express.js and TypeScript, featuring Supabase authentication and a robust storage interface.

## Base URL

```
Development: http://localhost:5000/api
Production: [To be configured]
```

## Authentication

All API endpoints require authentication using Supabase JWT tokens.

### Headers Required
```http
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

## API Endpoints

### Health Check

#### GET /api/health
Check API server status and configuration.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "development",
  "features": {
    "aiDiagnosis": true,
    "medicationTracking": true,
    "voiceNotes": false
  },
  "storage": {
    "status": "healthy",
    "type": "mock" // or "supabase"
  }
}
```

### User Management

#### GET /api/users/:userId
Get user profile information.

**Parameters:**
- `userId` (string): User ID

**Response:**
```json
{
  "id": 1,
  "email": "sarah.chen@example.com",
  "firstName": "Sarah",
  "lastName": "Chen",
  "dateOfBirth": "1988-03-22T00:00:00Z",
  "gender": "female",
  "heightCm": 165,
  "weightKg": 58.5,
  "phoneNumber": "+1-555-0123",
  "emergencyContactName": "Michael Chen",
  "emergencyContactPhone": "+1-555-0124",
  "timezone": "America/New_York",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### PUT /api/users/:userId
Update user profile information.

**Request Body:**
```json
{
  "firstName": "Sarah",
  "lastName": "Chen",
  "phoneNumber": "+1-555-0123",
  "emergencyContactName": "Michael Chen",
  "emergencyContactPhone": "+1-555-0124"
}
```

### Symptom Entries

#### GET /api/symptom-entries
Get user's symptom entries.

**Query Parameters:**
- `userId` (required): User ID
- `limit` (optional): Number of entries to return

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "symptomSetId": null,
    "symptomDescription": "Severe headache with visual aura",
    "bodyLocation": "Head",
    "severityScore": 8,
    "onsetDate": "2024-01-15T08:00:00Z",
    "durationHours": 4,
    "frequency": "episodic",
    "triggers": "stress, chocolate",
    "associatedSymptoms": ["nausea", "light sensitivity"],
    "photoUrls": [],
    "voiceNoteUrl": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### POST /api/symptom-entries
Create a new symptom entry.

**Request Body:**
```json
{
  "userId": 1,
  "symptomDescription": "Severe headache with visual aura",
  "bodyLocation": "Head",
  "severityScore": 8,
  "onsetDate": "2024-01-15T08:00:00Z",
  "durationHours": 4,
  "frequency": "episodic",
  "triggers": "stress, chocolate",
  "associatedSymptoms": ["nausea", "light sensitivity"]
}
```

#### GET /api/symptom-entries/:entryId
Get a specific symptom entry.

#### PUT /api/symptom-entries/:entryId
Update a symptom entry.

#### DELETE /api/symptom-entries/:entryId
Delete a symptom entry.

### AI Diagnosis

#### POST /api/ai/diagnose
Get AI-powered diagnosis for symptoms.

**Request Body:**
```json
{
  "symptoms": "severe headache with visual aura, nausea, light sensitivity",
  "userId": 1,
  "additionalContext": "Patient has history of migraines"
}
```

**Response:**
```json
{
  "diagnosis": {
    "primary": "Migraine with Aura",
    "confidence": 0.85,
    "reasoning": "Classic presentation of migraine with visual aura...",
    "urgencyLevel": "medium",
    "redFlags": [],
    "recommendations": [
      "Rest in dark, quiet room",
      "Apply cold compress",
      "Stay hydrated"
    ]
  },
  "aiProvider": "claude",
  "responseTime": 1250
}
```

#### POST /api/ai/compare
Compare diagnoses from multiple AI providers.

**Request Body:**
```json
{
  "symptoms": "severe headache with visual aura",
  "userId": 1
}
```

**Response:**
```json
{
  "comparisons": [
    {
      "provider": "claude",
      "diagnosis": "Migraine with Aura",
      "confidence": 0.85,
      "responseTime": 1250
    },
    {
      "provider": "openai",
      "diagnosis": "Classic Migraine",
      "confidence": 0.82,
      "responseTime": 980
    }
  ],
  "consensus": {
    "agreement": "high",
    "primaryDiagnosis": "Migraine with Aura",
    "averageConfidence": 0.835
  }
}
```

### Differential Diagnoses

#### GET /api/differential-diagnoses/:symptomEntryId
Get differential diagnoses for a symptom entry.

#### POST /api/differential-diagnoses
Create a new differential diagnosis.

#### PUT /api/differential-diagnoses/:diagnosisId
Update a differential diagnosis.

#### DELETE /api/differential-diagnoses/:diagnosisId
Delete a differential diagnosis.

### Prescriptions

#### GET /api/prescriptions
Get user's prescriptions.

**Query Parameters:**
- `userId` (required): User ID
- `active` (optional): Filter for active prescriptions only

#### POST /api/prescriptions
Create a new prescription.

#### PUT /api/prescriptions/:prescriptionId
Update a prescription.

#### DELETE /api/prescriptions/:prescriptionId
Delete a prescription.

### Medical History

#### GET /api/medical-history
Get user's medical history.

**Query Parameters:**
- `userId` (required): User ID

#### POST /api/medical-history
Create a new medical history entry.

### Notifications

#### GET /api/notifications
Get user's notifications.

**Query Parameters:**
- `userId` (required): User ID

#### PUT /api/notifications/:notificationId/read
Mark a notification as read.

#### DELETE /api/notifications/:notificationId
Delete a notification.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "severityScore",
      "issue": "Must be between 1 and 10"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Codes

- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `INTERNAL_ERROR`: Server error
- `RATE_LIMITED`: Too many requests

## Rate Limiting

- General API: 100 requests per minute per user
- AI endpoints: 10 requests per minute per user
- File uploads: 5 requests per minute per user

## Development Setup

See [README.md](../README.md) for complete setup instructions.

### Quick Start

```powershell
# Windows
npm run dev:win

# Linux/Mac
npm run dev
```

### Testing

```powershell
# Test API endpoints
npm run test:api:win

# Test database connection
npm run test:db:win
```

## Support

For API support and questions:
- Documentation: [docs/](../docs/)
- Issues: GitHub Issues
- Email: [Contact information]
