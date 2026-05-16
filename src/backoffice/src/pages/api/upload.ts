import { IncomingForm } from 'formidable'
import fs from 'fs'
import { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
}

type Data = {
  message?: string;
  error?: string;
  path?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // Use absolute path for upload directory
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const form: any = new IncomingForm()
  form.uploadDir = uploadDir
  form.keepExtensions = true
  form.maxFileSize = 10 * 1024 * 1024 // 10MB limit

  form.parse(req, async (err: any, fields: any, files: any) => {
    if (err) {
      console.error('Formidable parse error:', err)
      res.status(500).json({ error: 'There was an error parsing the files: ' + err.message })
      return
    }

    // Handle both array and single value for fileName
    const fileName = Array.isArray(fields.fileName) ? fields.fileName[0] : fields.fileName
    if (typeof fileName !== 'string') {
      res.status(400).json({ error: 'Invalid file name' })
      return
    }

    const uploadPath = path.join(uploadDir, fileName)
    const dir = path.dirname(uploadPath)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Handle both array and single file
    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file || !file.filepath) {
      res.status(400).json({ error: 'File upload error: No file received' })
      return
    }

    const filePath = file.filepath

    fs.rename(filePath, uploadPath, (err1) => {
      if (err1) {
        console.error('File rename error:', err1)
        res.status(500).json({ error: 'There was an error uploading the file: ' + err1.message })
        return
      }
      // Convert absolute path to relative path from public directory
      const url = path.relative(path.join(process.cwd(), 'public'), uploadPath).replace(/\\/g, '/')
      res.status(200).json({ message: 'File uploaded successfully', path: '/' + url })
    })
  })
}
