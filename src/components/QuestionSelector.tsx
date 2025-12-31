import { useState } from 'react';
import { Question } from '../types/question';

interface QuestionSelectorProps {
  questions: Question[];
  currentQuestionId?: string;
  onSelect: (questionId: string) => void;
  onClose: () => void;
}

export function QuestionSelector({ questions, currentQuestionId, onSelect, onClose }: QuestionSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(questions.map(q => q.category))];

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>❓</span>
            Выберите вопрос
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-4 border-b border-ocean-200 space-y-3">
          <input
            type="text"
            placeholder="Поиск по вопросу или ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border-2 border-ocean-200 rounded-lg focus:border-purple-500 focus:outline-none"
          />

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-ocean-100 text-ocean-700 hover:bg-ocean-200'
                }`}
              >
                {cat === 'all' ? 'Все' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredQuestions.map(question => (
              <button
                key={question.id}
                onClick={() => {
                  onSelect(question.id);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                  question.id === currentQuestionId
                    ? 'bg-purple-50 border-purple-400'
                    : 'bg-white border-ocean-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      {question.id}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-ocean-600">
                        {question.category}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        question.difficulty === 'easy'
                          ? 'bg-green-100 text-green-700'
                          : question.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {question.difficulty === 'easy' ? 'Легкий' : question.difficulty === 'medium' ? 'Средний' : 'Сложный'}
                      </span>
                      <span className="text-sm font-bold text-purple-600">
                        {question.points} баллов
                      </span>
                    </div>
                    <div className="text-ocean-800 font-medium line-clamp-2">
                      {question.question}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12 text-ocean-500">
              <div className="text-4xl mb-2">🔍</div>
              <div>Вопросы не найдены</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-ocean-50 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-ocean-600">
            Найдено вопросов: {filteredQuestions.length}
          </div>
          <button
            onClick={onClose}
            className="bg-ocean-600 text-white px-6 py-2 rounded-lg hover:bg-ocean-700 transition-colors font-semibold"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
