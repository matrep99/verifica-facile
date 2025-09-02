import { Test, Question, Submission, Answer, User } from '@/types';

// Store locale per l'app verifiche
class VerificheStore {
  private tests: Map<string, Test> = new Map();
  private questions: Map<string, Question[]> = new Map();
  private submissions: Map<string, Submission> = new Map();
  private answers: Map<string, Answer[]> = new Map();
  private currentUser: User | null = null;

  constructor() {
    this.loadFromStorage();
    this.initDefaultUser();
    this.initDemoData();
  }

  // User management
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  loginDemo(): User {
    this.currentUser = {
      id: 'demo-docente',
      email: 'docente@example.com',
      role: 'DOCENTE',
      name: 'Prof. Demo'
    };
    this.saveToStorage();
    return this.currentUser;
  }

  // Tests management
  createTest(title: string, subject: string = 'Generale', topic: string = 'Argomento generico', classLabel: string = '1A'): Test {
    const test: Test = {
      id: `test-${Date.now()}`,
      title: title || 'Nuova Verifica',
      description: '',
      subject,
      topic,
      classLabel,
      status: 'DRAFT',
      ownerId: this.currentUser?.id || 'demo-docente',
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tests.set(test.id, test);
    
    // Crea la prima domanda demo coerente con la disciplina
    const demoQuestion: Question = {
      id: `q-${Date.now()}`,
      testId: test.id,
      questionIndex: 0,
      type: 'MCQ',
      prompt: this.getDemoQuestionForSubject(subject, topic),
      options: this.getDemoOptionsForSubject(subject),
      correctAnswer: { selected: 0 },
      points: 1
    };

    this.questions.set(test.id, [demoQuestion]);
    this.saveToStorage();
    return test;
  }

  getUserTests(userId: string): Test[] {
    return Array.from(this.tests.values())
      .filter(test => test.ownerId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getTest(testId: string): Test | null {
    return this.tests.get(testId) || null;
  }

  updateTest(testId: string, updates: Partial<Test>): Test | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const updatedTest = { ...test, ...updates, updatedAt: new Date() };
    this.tests.set(testId, updatedTest);
    this.saveToStorage();
    return updatedTest;
  }

  publishTest(testId: string): Test | null {
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    return this.updateTest(testId, {
      status: 'PUBLISHED',
      settings: { joinCode }
    });
  }

  // Questions management
  getQuestions(testId: string): Question[] {
    return this.questions.get(testId) || [];
  }

  addQuestion(testId: string, question: Omit<Question, 'id' | 'testId' | 'questionIndex'>): Question {
    const existingQuestions = this.getQuestions(testId);
    const newQuestion: Question = {
      ...question,
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      testId,
      questionIndex: existingQuestions.length
    };

    const updatedQuestions = [...existingQuestions, newQuestion];
    this.questions.set(testId, updatedQuestions);
    this.saveToStorage();
    return newQuestion;
  }

  updateQuestion(questionId: string, updates: Partial<Question>): Question | null {
    for (const [testId, questions] of this.questions.entries()) {
      const questionIndex = questions.findIndex(q => q.id === questionId);
      if (questionIndex !== -1) {
        const updatedQuestion = { ...questions[questionIndex], ...updates };
        questions[questionIndex] = updatedQuestion;
        this.questions.set(testId, questions);
        this.saveToStorage();
        return updatedQuestion;
      }
    }
    return null;
  }

  deleteQuestion(questionId: string): boolean {
    for (const [testId, questions] of this.questions.entries()) {
      const filteredQuestions = questions.filter(q => q.id !== questionId);
      if (filteredQuestions.length !== questions.length) {
        // Ricalcola gli indici
        const reindexedQuestions = filteredQuestions.map((q, index) => ({ ...q, questionIndex: index }));
        this.questions.set(testId, reindexedQuestions);
        this.saveToStorage();
        return true;
      }
    }
    return false;
  }

  // Submissions management
  createSubmission(joinCode: string, studentName: string): Submission | null {
    const test = Array.from(this.tests.values()).find(t => t.settings.joinCode === joinCode);
    if (!test || test.status !== 'PUBLISHED') return null;

    const submission: Submission = {
      id: `sub-${Date.now()}`,
      testId: test.id,
      studentName,
      state: 'IN_PROGRESS',
      startedAt: new Date()
    };

    this.submissions.set(submission.id, submission);
    this.answers.set(submission.id, []);
    this.saveToStorage();
    return submission;
  }

  getSubmission(submissionId: string): Submission | null {
    return this.submissions.get(submissionId) || null;
  }

  getTestSubmissions(testId: string): Submission[] {
    return Array.from(this.submissions.values())
      .filter(s => s.testId === testId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  saveAnswer(submissionId: string, questionId: string, response: any): Answer {
    const existingAnswers = this.answers.get(submissionId) || [];
    const existingIndex = existingAnswers.findIndex(a => a.questionId === questionId);

    const answer: Answer = {
      id: existingIndex >= 0 ? existingAnswers[existingIndex].id : `ans-${Date.now()}`,
      submissionId,
      questionId,
      response
    };

    if (existingIndex >= 0) {
      existingAnswers[existingIndex] = answer;
    } else {
      existingAnswers.push(answer);
    }

    this.answers.set(submissionId, existingAnswers);
    this.saveToStorage();
    return answer;
  }

  submitSubmission(submissionId: string): Submission | null {
    const submission = this.submissions.get(submissionId);
    if (!submission) return null;

    const updatedSubmission = {
      ...submission,
      state: 'SUBMITTED' as const,
      submittedAt: new Date()
    };

    this.submissions.set(submissionId, updatedSubmission);
    this.autoGradeSubmission(submissionId);
    this.saveToStorage();
    return updatedSubmission;
  }

  getSubmissionAnswers(submissionId: string): Answer[] {
    return this.answers.get(submissionId) || [];
  }

  private autoGradeSubmission(submissionId: string) {
    const submission = this.submissions.get(submissionId);
    if (!submission) return;

    const questions = this.getQuestions(submission.testId);
    const answers = this.getSubmissionAnswers(submissionId);
    let totalScore = 0;

    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) return;

      let score = 0;
      if (question.type === 'MCQ' && question.correctAnswer?.selected !== undefined) {
        if (answer.response.selected === question.correctAnswer.selected) {
          score = question.points;
        }
      } else if (question.type === 'TF' && question.correctAnswer?.boolean !== undefined) {
        if (answer.response.boolean === question.correctAnswer.boolean) {
          score = question.points;
        }
      }

      answer.autoScore = score;
      answer.finalScore = score;
      totalScore += score;
    });

    this.answers.set(submissionId, answers);
    submission.totalScore = totalScore;
    this.submissions.set(submissionId, submission);
  }

  // Storage management
  private saveToStorage() {
    const data = {
      tests: Array.from(this.tests.entries()),
      questions: Array.from(this.questions.entries()),
      submissions: Array.from(this.submissions.entries()),
      answers: Array.from(this.answers.entries()),
      currentUser: this.currentUser
    };
    localStorage.setItem('verifiche-app-data', JSON.stringify(data, (key, value) => {
      if (value instanceof Date) {
        return { __date: value.toISOString() };
      }
      return value;
    }));
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem('verifiche-app-data');
      if (data) {
        const parsed = JSON.parse(data, (key, value) => {
          if (value && typeof value === 'object' && value.__date) {
            return new Date(value.__date);
          }
          return value;
        });

        this.tests = new Map(parsed.tests || []);
        this.questions = new Map(parsed.questions || []);
        this.submissions = new Map(parsed.submissions || []);
        this.answers = new Map(parsed.answers || []);
        this.currentUser = parsed.currentUser || null;
      }
    } catch (error) {
      console.warn('Errore nel caricamento dati dal localStorage:', error);
    }
  }

  private initDefaultUser() {
    if (!this.currentUser) {
      this.loginDemo();
    }
  }

  private getDemoQuestionForSubject(subject: string, topic: string): string {
    const questions = {
      'Storia': `Qual è la capitale dell'antica Roma relativa a ${topic}?`,
      'Matematica': `Quanto fa 2 + 2?`,
      'Italiano': `Chi ha scritto "I Promessi Sposi"?`,
      'Scienze': `Qual è la formula dell'acqua?`,
      'Geografia': `Qual è la capitale d'Italia?`,
    };
    return questions[subject as keyof typeof questions] || 'Qual è la capitale d\'Italia?';
  }

  private getDemoOptionsForSubject(subject: string): string[] {
    const options = {
      'Storia': ['Roma', 'Atene', 'Sparta', 'Cartagine'],
      'Matematica': ['4', '3', '5', '2'],
      'Italiano': ['Alessandro Manzoni', 'Dante Alighieri', 'Giovanni Verga', 'Italo Calvino'],
      'Scienze': ['H2O', 'CO2', 'NaCl', 'H2SO4'],
      'Geografia': ['Roma', 'Milano', 'Torino', 'Napoli'],
    };
    return options[subject as keyof typeof options] || ['Roma', 'Milano', 'Torino', 'Napoli'];
  }

  private initDemoData() {
    if (this.tests.size === 0) {
      // Crea una verifica demo
      const demoTest = this.createTest('Verifica di Storia Antica', 'Storia', 'Antica Roma', '2A');
      this.updateTest(demoTest.id, {
        description: 'Verifica sui principali eventi dell\'antica Roma',
        status: 'PUBLISHED',
        settings: { joinCode: 'DEMO01' }
      });

      // Aggiungi altre domande demo
      this.addQuestion(demoTest.id, {
        type: 'TF',
        prompt: 'Giulio Cesare fu il primo imperatore romano.',
        correctAnswer: { boolean: false },
        points: 1
      });

      this.addQuestion(demoTest.id, {
        type: 'SHORT',
        prompt: 'In che anno fu fondato l\'Impero Romano?',
        correctAnswer: { value: '27 a.C.' },
        points: 2
      });
    }
  }

  // Analytics
  getTestAnalytics(testId: string) {
    const submissions = this.getTestSubmissions(testId);
    const questions = this.getQuestions(testId);
    const submittedSubmissions = submissions.filter(s => s.state === 'SUBMITTED');

    const totalSubmissions = submittedSubmissions.length;
    const averageScore = totalSubmissions > 0 
      ? submittedSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0) / totalSubmissions
      : 0;

    const questionStats = questions.map(question => {
      let correctAnswers = 0;
      let totalAnswers = 0;

      submittedSubmissions.forEach(submission => {
        const answers = this.getSubmissionAnswers(submission.id);
        const answer = answers.find(a => a.questionId === question.id);
        if (answer) {
          totalAnswers++;
          if (answer.autoScore === question.points) {
            correctAnswers++;
          }
        }
      });

      return {
        questionId: question.id,
        prompt: question.prompt,
        correctAnswers,
        totalAnswers,
        averageScore: totalAnswers > 0 ? (correctAnswers / totalAnswers) * question.points : 0
      };
    });

    return {
      testId,
      totalSubmissions,
      averageScore,
      completionRate: totalSubmissions > 0 ? (submittedSubmissions.length / totalSubmissions) * 100 : 0,
      questionStats
    };
  }
}

export const store = new VerificheStore();