import { Handler } from '@netlify/functions'
import pg from 'pg'

const { Client } = pg

const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const data = JSON.parse(event.body || '{}')
    
    // Connect to Supabase
    // URL-encoding special characters in the password
    const connectionString = 'postgresql://postgres:Qn%3F%409%40Rivkzcwjv@db.hhkrkehvtuzukwxxuoyo.supabase.co:5432/postgres'
    
    const client = new Client({ connectionString })
    await client.connect()

    const query = `
      INSERT INTO applications (
        id, job_id, job_title, first_name, last_name, email, company, 
        current_title, country, website, source, message, resume_name, resume_link, stage
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
    `
    const values = [
      data.id,
      data.jobId,
      data.jobTitle,
      data.firstName,
      data.lastName,
      data.email,
      data.company,
      data.currentTitle,
      data.country,
      data.website,
      data.source,
      data.message,
      data.resumeName,
      data.resumeLink,
      data.stage || 'New'
    ]

    await client.query(query, values)
    await client.end()

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }
  } catch (error) {
    console.error('Error inserting application:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    }
  }
}

export { handler }
