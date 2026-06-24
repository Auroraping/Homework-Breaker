import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
const pdf = require('pdf-parse');

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    const mimeType = file.type;
    const fileName = file.name.toLowerCase();

    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const data = await pdf(buffer);
      text = data.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (mimeType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      text = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' }, { status: 400 });
    }

    return NextResponse.json({ text, fileName: file.name });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse file' }, { status: 500 });
  }
}
