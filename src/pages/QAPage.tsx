import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import questions from '@AP1-C01/parsed_questions.json';
import { Question } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const QAPage: React.FC = () => {
  const { uuid, id } = useParams<{ uuid: string; id: string }>();
  const navigate = useNavigate();
  const questionId = parseInt(id || '1', 10);
  
  const question = questions[questionId - 1] as Question;
  const totalQuestions = questions.length;

  const existingAnswer = useLiveQuery(
    () => db.answers.where({ uuid, question_number: questionId }).first(),
    [uuid, questionId]
  );

  const [selectedChoices, setSelectedChoices] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (existingAnswer) {
      setSelectedChoices(existingAnswer.selected_choices);
      setRevealed(true);
    } else {
      setSelectedChoices([]);
      setRevealed(false);
    }
  }, [existingAnswer]);

  const handleSelect = (index: number) => {
    const single = question.choices.filter((c) => c.is_correct).length === 1;
    if (single) {
      setSelectedChoices([index]);
    } else {
      if (selectedChoices.includes(index)) {
        setSelectedChoices(selectedChoices.filter((i) => i !== index));
      } else {
        setSelectedChoices([...selectedChoices, index]);
      }
    }
  };

  const handleSave = async () => {
    if (!uuid) return;
    
    await db.answers.put({
      uuid,
      question_number: questionId,
      selected_choices: selectedChoices,
      timestamp: Date.now(),
    });
  };

  const handleAnswer = async () => {
    await handleSave();
    setRevealed(true);
  };

  const handleNext = async () => {
    await handleSave();
    if (questionId < totalQuestions) {
      navigate(`/qa/${uuid}/${questionId + 1}`);
    }
  };

  const handlePrev = async () => {
    await handleSave();
    if (questionId > 1) {
      navigate(`/qa/${uuid}/${questionId - 1}`);
    }
  };
  
  const handleRandomUnanswered = async () => {
    await handleSave();
    if (!uuid) return;

    const answeredIds = await db.answers.where('uuid').equals(uuid).primaryKeys();
    // primaryKeys returns [uuid, question_number] arrays?
    // Wait, compound index.
    // It returns [uuid, question_number][]
    
    // Actually, I can use Collection.uniqueKeys() or just map.
    // Let's fetch all answers for this UUID.
    const answers = await db.answers.where('uuid').equals(uuid).toArray();
    const answeredSet = new Set(answers.map(a => a.question_number));
    
    const allIds = Array.from({ length: totalQuestions }, (_, i) => i + 1);
    const unansweredIds = allIds.filter(id => !answeredSet.has(id));
    
    if (unansweredIds.length === 0) {
      alert("All questions answered!");
      return;
    }
    
    const randomId = unansweredIds[Math.floor(Math.random() * unansweredIds.length)];
    navigate(`/qa/${uuid}/${randomId}`);
  };

  const handleSummary = async () => {
    await handleSave();
    navigate(`/qa/${uuid}/summary`);
  };

  if (!question) return <div>Question not found</div>;

  const correctIndices = question.choices
    .map((c, i) => i)
    .filter((i) => question.choices[i].is_correct);
  const correctCount = correctIndices.length;
  const isSingleSelect = correctCount === 1;
  const selectLabel =
    correctCount <= 5
      ? ['Select two', 'Select three', 'Select four', 'Select five'][correctCount - 2]
      : `Select ${correctCount}`;

  const handleSelectSingle = (index: number) => {
    setSelectedChoices([index]);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-3xl flex justify-end mb-2">
        <Button variant="secondary" size="sm" onClick={handleSummary}>
          Summary
        </Button>
      </div>
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">Question {questionId} of {totalQuestions}</span>
            <div className="flex items-center gap-2">
              {!isSingleSelect && <Badge variant="secondary">{selectLabel}</Badge>}
              {question.domain && (
                <span className="text-sm font-medium text-blue-600">{question.domain}</span>
              )}
            </div>
          </div>
          <CardTitle className="text-xl leading-relaxed">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {isSingleSelect ? (
              <RadioGroup
                value={selectedChoices[0] !== undefined ? String(selectedChoices[0]) : ''}
                onValueChange={(v) => !revealed && v !== '' && handleSelectSingle(parseInt(v, 10))}
                disabled={revealed}
                className="grid gap-4"
              >
                {question.choices.map((choice, index) => {
                  const isCorrectChoice = correctIndices.includes(index);
                  const isWrongSelected = revealed && selectedChoices.includes(index) && !isCorrectChoice;
                  const highlightGreen = revealed && isCorrectChoice;
                  const highlightRed = isWrongSelected;
                  const choiceBg = highlightGreen
                    ? 'bg-green-50 border-green-300'
                    : highlightRed
                      ? 'bg-red-50 border-red-300'
                      : selectedChoices.includes(index)
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50 border-gray-200';
                  return (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${choiceBg}`}
                      onClick={() => !revealed && handleSelectSingle(index)}
                    >
                      <RadioGroupItem value={String(index)} className="mt-1" disabled={revealed} />
                      <div className="space-y-1">
                        <label className="text-sm font-medium leading-none cursor-pointer">
                          {choice.text}
                        </label>
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
            ) : (
              question.choices.map((choice, index) => {
                const isCorrectChoice = correctIndices.includes(index);
                const isWrongSelected = revealed && selectedChoices.includes(index) && !isCorrectChoice;
                const highlightGreen = revealed && isCorrectChoice;
                const highlightRed = isWrongSelected;
                const choiceBg = highlightGreen
                  ? 'bg-green-50 border-green-300'
                  : highlightRed
                    ? 'bg-red-50 border-red-300'
                    : selectedChoices.includes(index)
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50 border-gray-200';
                return (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${choiceBg}`}
                    onClick={() => !revealed && handleSelect(index)}
                  >
                    <Checkbox
                      checked={selectedChoices.includes(index)}
                      onCheckedChange={() => !revealed && handleSelect(index)}
                      className="mt-1"
                      disabled={revealed}
                    />
                    <div className="space-y-1">
                      <label className="text-sm font-medium leading-none cursor-pointer">
                        {choice.text}
                      </label>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap gap-4 justify-between mt-8 pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRandomUnanswered}>
                Random
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={questionId <= 1}
              >
                Previous
              </Button>
              {!revealed ? (
                <Button onClick={handleAnswer} disabled={selectedChoices.length === 0}>
                  Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={questionId >= totalQuestions}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QAPage;
