import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import questions from '@AP1-C01/parsed_questions.json';
import { Question } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const QASummary: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();

  const answers = useLiveQuery(
    () => db.answers.where('uuid').equals(uuid || '').toArray(),
    [uuid]
  );

  const { domainStats, serviceStats } = useMemo(() => {
    if (!answers) return { domainStats: {}, serviceStats: {} };

    const dStats: Record<string, { correct: number, answered: number, total: number }> = {};
    const sStats: Record<string, { correct: number, answered: number, total: number }> = {};

    // Initialize totals based on ALL questions
    questions.forEach((q: any) => {
      const domain = q.domain || 'Uncategorized';
      if (!dStats[domain]) dStats[domain] = { correct: 0, answered: 0, total: 0 };
      dStats[domain].total++;

      q.services_mentioned?.forEach((service: string) => {
        if (!sStats[service]) sStats[service] = { correct: 0, answered: 0, total: 0 };
        sStats[service].total++;
      });
    });

    // Process answers
    answers.forEach((ans) => {
      const q = questions[ans.question_number - 1] as Question;
      if (!q) return;

      const isCorrect = ans.selected_choices.length === 1 && ans.selected_choices[0] === q.correct_index;
      const domain = q.domain || 'Uncategorized';

      if (dStats[domain]) {
        dStats[domain].answered++;
        if (isCorrect) dStats[domain].correct++;
      }

      q.services_mentioned?.forEach((service: string) => {
        if (sStats[service]) {
          sStats[service].answered++;
          if (isCorrect) sStats[service].correct++;
        }
      });
    });

    return { domainStats: dStats, serviceStats: sStats };
  }, [answers]);

  const handleExport = async () => {
    if (!answers || !uuid) return;
    
    const exportData = {
      uuid,
      timestamp: Date.now(),
      answers,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-session-${uuid}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBackToQuestions = () => {
    // Go to the last answered question or question 1
    if (answers && answers.length > 0) {
      const last = answers.sort((a, b) => b.timestamp - a.timestamp)[0];
      navigate(`/qa/${uuid}/${last.question_number}`);
    } else {
      navigate(`/qa/${uuid}/1`);
    }
  };

  return (
    <div className="container mx-auto p-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Session Summary</h1>
        <div className="space-x-4">
          <Button variant="outline" onClick={handleBackToQuestions}>Back to Questions</Button>
          <Button onClick={handleExport}>Export Session</Button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Domain Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead className="text-right">Correct</TableHead>
                  <TableHead className="text-right">Answered</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(domainStats).map(([domain, stats]) => (
                  <TableRow key={domain}>
                    <TableCell className="font-medium">{domain}</TableCell>
                    <TableCell className="text-right">{stats.correct}</TableCell>
                    <TableCell className="text-right">{stats.answered}</TableCell>
                    <TableCell className="text-right">{stats.total}</TableCell>
                    <TableCell className="text-right">
                      {stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Performance (Top 20)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Correct</TableHead>
                  <TableHead className="text-right">Answered</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(serviceStats)
                  .sort(([, a], [, b]) => b.answered - a.answered)
                  .slice(0, 20)
                  .map(([service, stats]) => (
                    <TableRow key={service}>
                      <TableCell className="font-medium">{service}</TableCell>
                      <TableCell className="text-right">{stats.correct}</TableCell>
                      <TableCell className="text-right">{stats.answered}</TableCell>
                      <TableCell className="text-right">{stats.total}</TableCell>
                      <TableCell className="text-right">
                        {stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questions Answered</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question #</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Your Answer(s)</TableHead>
                  <TableHead>Correct Answer(s)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {answers?.sort((a, b) => a.question_number - b.question_number).filter((answer) => answer.selected_choices.length > 0).map((answer) => {
                  const question = questions[answer.question_number - 1] as Question;
                  if (!question) return null;
                  
                  const correctChoices = question.choices
                    .map((choice, index) => ({ choice, index }))
                    .filter(({ choice }) => choice.is_correct);
                  
                  const userChoices = answer.selected_choices.map(index => ({
                    choice: question.choices[index],
                    index
                  }));
                  
                  const isCorrect = answer.selected_choices.length === correctChoices.length &&
                    correctChoices.every(({ index }) => answer.selected_choices.includes(index));
                  
                  const isPartial = answer.selected_choices.length > 0 && 
                    answer.selected_choices.some(index => correctChoices.some(({ index: correctIndex }) => correctIndex === index)) &&
                    !isCorrect;
                  
                  return (
                    <TableRow key={answer.question_number}>
                      <TableCell>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-blue-600 hover:text-blue-800"
                          onClick={() => navigate(`/qa/${uuid}/${answer.question_number}`)}
                        >
                          #{answer.question_number}
                        </Button>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={question.question}>
                          {question.question}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {userChoices.map(({ choice, index }) => (
                            <div key={index} className="text-sm">
                              {choice.text.substring(0, 80)}
                              {choice.text.length > 80 && '...'}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {correctChoices.map(({ choice, index }) => (
                            <div key={index} className="text-sm text-green-700">
                              {choice.text.substring(0, 80)}
                              {choice.text.length > 80 && '...'}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isCorrect ? (
                          <Badge className="bg-green-100 text-green-800">Correct</Badge>
                        ) : isPartial ? (
                          <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Incorrect</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QASummary;
