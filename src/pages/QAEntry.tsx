import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/db';
import questions from '@AP1-C01/parsed_questions.json';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const QAEntry: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStart = () => {
    const newUuid = uuidv4();
    navigate(`/qa/${newUuid}/1`);
  };

  const handleRandom = () => {
    const newUuid = uuidv4();
    const randomId = Math.floor(Math.random() * questions.length) + 1;
    navigate(`/qa/${newUuid}/${randomId}`);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.uuid || !Array.isArray(data.answers)) {
        alert('Invalid import file format');
        return;
      }

      await db.answers.bulkPut(data.answers);
      
      // Determine where to redirect: last answered question or summary
      const lastAnswer = data.answers.sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
      if (lastAnswer) {
        navigate(`/qa/${data.uuid}/${lastAnswer.question_number}`);
      } else {
        navigate(`/qa/${data.uuid}/summary`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import session');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">AWS Certified AI Practitioner QA</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={handleStart} className="w-full h-12 text-lg">
            Start New Session
          </Button>
          <Button onClick={handleRandom} variant="outline" className="w-full h-12 text-lg">
            Start Random Question
          </Button>
          
          <div className="relative">
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              variant="secondary" 
              className="w-full h-12 text-lg"
            >
              Import Session
            </Button>
          </div>
          
          <div className="text-sm text-gray-500 text-center mt-4">
            Total Questions: {questions.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QAEntry;
