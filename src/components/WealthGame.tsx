import React, { useState, useEffect } from 'react';
import {
  Home,
  Car,
  Coffee,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Wallet,
  PiggyBank,
  TrendingDown
} from 'lucide-react';

// --- Game Data ---
const INITIAL_INCOME = 10000;
const SHOCK_INCOME = 5000;
const SHOCK_TIMER = 30; // seconds

const CATEGORIES = {
  housing: {
    id: 'housing',
    title: 'Housing',
    icon: Home,
    description: 'Where will you live?',
    flexible: false,
    options: [
      { id: 'fancy_condo', label: 'Fancy Condo', desc: '1-year contract, luxury amenities', cost: 3500 },
      { id: 'basic_apt', label: 'Basic Apartment', desc: 'Standard living, close to transit', cost: 1500 }
    ]
  },
  transport: {
    id: 'transport',
    title: 'Transportation',
    icon: Car,
    description: 'How will you get around?',
    flexible: false,
    options: [
      { id: 'luxury_car', label: 'Luxury Car', desc: '5-year bank loan, premium status', cost: 2500 },
      { id: 'used_car', label: 'Used Car / Transit', desc: 'Reliable A-to-B transport', cost: 800 }
    ]
  },
  lifestyle: {
    id: 'lifestyle',
    title: 'Lifestyle & Food',
    icon: Coffee,
    description: 'How do you spend your free time?',
    flexible: true,
    options: [
      { id: 'fancy_life', label: 'Travel & Fine Dining', desc: 'Eating out, weekend getaways', cost: 2000 },
      { id: 'simple_life', label: 'Simple Living', desc: 'Home cooking, local hobbies', cost: 500 }
    ]
  }
};

export default function WealthGame() {
  const [gameState, setGameState] = useState<'intro' | 'budgeting' | 'shock_reveal' | 'adjusting' | 'results'>('intro');
  const [income, setIncome] = useState(INITIAL_INCOME);
  const [selections, setSelections] = useState<Record<string, string | null>>({
    housing: null,
    transport: null,
    lifestyle: null
  });
  const [timeLeft, setTimeLeft] = useState(SHOCK_TIMER);

  const totalExpenses = Object.keys(selections).reduce((total, categoryKey) => {
    const selectedOptionId = selections[categoryKey];
    if (!selectedOptionId) return total;
    const option = CATEGORIES[categoryKey as keyof typeof CATEGORIES].options.find(o => o.id === selectedOptionId);
    return total + (option ? option.cost : 0);
  }, 0);

  const balance = income - totalExpenses;
  const isBudgetComplete = selections.housing && selections.transport && selections.lifestyle;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (gameState === 'adjusting' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'adjusting' && timeLeft <= 0) {
      setGameState('results');
    }
    return () => { if (timer) clearInterval(timer); };
  }, [gameState, timeLeft]);

  const handleSelect = (category: keyof typeof CATEGORIES, optionId: string) => {
    if (gameState === 'adjusting' && !CATEGORIES[category].flexible) return;
    setSelections(prev => ({ ...prev, [category]: optionId }));
  };

  const triggerShock = () => {
    setGameState('shock_reveal');
    setTimeout(() => {
      setIncome(SHOCK_INCOME);
      setGameState('adjusting');
    }, 4000);
  };

  const finishGame = () => setGameState('results');

  const resetGame = () => {
    setGameState('intro');
    setIncome(INITIAL_INCOME);
    setSelections({ housing: null, transport: null, lifestyle: null });
    setTimeLeft(SHOCK_TIMER);
  };

  const OptionCard = ({ category, option }: { category: (typeof CATEGORIES)[keyof typeof CATEGORIES]; option: { id: string; label: string; desc: string; cost: number } }) => {
    const isSelected = selections[category.id] === option.id;
    const isLocked = gameState === 'adjusting' && !category.flexible;

    return (
      <button
        onClick={() => handleSelect(category.id as keyof typeof CATEGORIES, option.id)}
        disabled={isLocked}
        className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 relative overflow-hidden
          ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-200 bg-white hover:border-indigo-300'}
          ${isLocked ? 'opacity-60 cursor-not-allowed grayscale-[50%]' : 'cursor-pointer'}
        `}
      >
        {isLocked && (
          <div className="absolute top-2 right-2 text-red-500 flex items-center bg-red-50 px-2 py-1 rounded text-xs font-bold">
            <Lock size={12} className="mr-1" /> Locked
          </div>
        )}
        {gameState === 'adjusting' && category.flexible && (
          <div className="absolute top-2 right-2 text-green-600 flex items-center bg-green-50 px-2 py-1 rounded text-xs font-bold">
            <Unlock size={12} className="mr-1" /> Flexible
          </div>
        )}
        <div className="flex justify-between items-center mb-2">
          <h4 className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>{option.label}</h4>
          <span className={`font-black ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
            RM {option.cost.toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-gray-500">{option.desc}</p>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-indigo-200">
      {gameState !== 'intro' && gameState !== 'shock_reveal' && (
        <div className={`sticky top-0 z-50 transition-colors duration-500 shadow-sm
          ${gameState === 'adjusting' ? 'bg-red-600 text-white' : 'bg-white text-slate-800'}`}>
          <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <Wallet className={gameState === 'adjusting' ? 'text-white' : 'text-indigo-600'} />
              <div>
                <p className={`text-xs uppercase font-bold ${gameState === 'adjusting' ? 'text-red-200' : 'text-slate-500'}`}>
                  Monthly Income
                </p>
                <p className="text-xl font-black">RM {income.toLocaleString()}</p>
              </div>
            </div>
            {gameState === 'adjusting' && (
              <div className="flex items-center space-x-3 bg-red-700 px-4 py-2 rounded-lg animate-pulse">
                <AlertTriangle size={24} className="text-yellow-300" />
                <div className="text-center">
                  <p className="text-xs uppercase font-bold text-red-200">Time to adjust</p>
                  <p className="text-xl font-black tabular-nums">{timeLeft}s</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className={`text-xs uppercase font-bold ${gameState === 'adjusting' ? 'text-red-200' : 'text-slate-500'}`}>Expenses</p>
                <p className="text-lg font-bold">RM {totalExpenses.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase font-bold ${gameState === 'adjusting' ? 'text-red-200' : 'text-slate-500'}`}>Leftover (Savings)</p>
                <p className={`text-lg font-black ${balance < 0 ? 'text-red-400' : (gameState === 'adjusting' ? 'text-white' : 'text-emerald-600')}`}>
                  RM {balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        {gameState === 'intro' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <TrendingDown size={48} className="text-indigo-600" />
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">
              The &quot;Life Shock&quot; Game
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Congratulations! You just landed a fantastic job earning <strong className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">RM 10,000</strong> a month.
              <br /><br />
              It&apos;s time to build your lifestyle. How will you allocate your newfound wealth?
            </p>
            <button
              onClick={() => setGameState('budgeting')}
              className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg hover:bg-indigo-700 transition-transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <span>Start Budgeting</span>
              <Wallet size={20} />
            </button>
          </div>
        )}

        {(gameState === 'budgeting' || gameState === 'adjusting') && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-900">
                {gameState === 'budgeting' ? 'Design Your Lifestyle' : 'Emergency Restructuring!'}
              </h2>
              <p className="text-slate-600 mt-2">
                {gameState === 'budgeting'
                  ? 'Choose your housing, transport, and lifestyle options below.'
                  : 'Adjust what you can before time runs out! Look for the flexible options.'}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {Object.values(CATEGORIES).map(category => {
                const CategoryIcon = category.icon;
                return (
                <div key={category.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                      <CategoryIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{category.title}</h3>
                      <p className="text-xs text-slate-500">{category.description}</p>
                    </div>
                  </div>
                  <div className="space-y-3 flex-grow">
                    {category.options.map(option => (
                      <OptionCard key={option.id} category={category} option={option} />
                    ))}
                  </div>
                  {gameState === 'adjusting' && !category.flexible && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800 flex items-start space-x-2">
                      <Lock size={16} className="mt-0.5 flex-shrink-0" />
                      <p><strong>Inflexible Burden:</strong> You signed a contract. You cannot change this instantly.</p>
                    </div>
                  )}
                </div>
              ); })}
            </div>
            <div className="flex justify-center mt-12">
              {gameState === 'budgeting' ? (
                <button
                  onClick={triggerShock}
                  disabled={!isBudgetComplete}
                  className={`px-10 py-4 rounded-full font-bold text-lg transition-all flex items-center space-x-2
                    ${isBudgetComplete
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl hover:-translate-y-1'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  <CheckCircle2 size={24} />
                  <span>Confirm Budget</span>
                </button>
              ) : (
                <button
                  onClick={finishGame}
                  className="px-10 py-4 bg-emerald-600 text-white rounded-full font-bold text-lg hover:bg-emerald-700 shadow-lg transition-transform hover:scale-105 flex items-center space-x-2"
                >
                  <CheckCircle2 size={24} />
                  <span>I&apos;m Done Adjusting</span>
                </button>
              )}
            </div>
          </div>
        )}

        {gameState === 'shock_reveal' && (
          <div className="fixed inset-0 bg-red-600 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white p-10 rounded-3xl max-w-2xl w-full text-center shadow-2xl transform transition-all scale-100 animate-in zoom-in-90 duration-500">
              <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <AlertTriangle size={48} />
              </div>
              <h1 className="text-5xl font-black text-slate-900 mb-4 uppercase tracking-tight">Life Shock!</h1>
              <h2 className="text-3xl font-bold text-red-600 mb-6">A recession just hit.</h2>
              <p className="text-xl text-slate-700 mb-8">
                Your company is downsizing. Your salary has been cut by 50%.<br />
                You now only earn <strong>RM 5,000</strong> a month.
              </p>
              <div className="inline-block bg-slate-100 px-6 py-3 rounded-lg text-slate-600 font-medium">
                You have 30 seconds to adjust your budget to survive.
              </div>
            </div>
          </div>
        )}

        {gameState === 'results' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className={`p-8 rounded-3xl text-center shadow-lg border-2 ${balance >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
              <div className="flex justify-center mb-4">
                {balance >= 0 ? <CheckCircle2 size={64} className="text-emerald-500" /> : <XCircle size={64} className="text-red-500" />}
              </div>
              <h1 className="text-4xl font-black mb-2">
                {balance >= 0 ? 'You Survived!' : 'You Went Into Debt!'}
              </h1>
              <p className="text-xl opacity-90">
                Your final balance is <strong className="font-black">RM {balance.toLocaleString()}</strong>
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
                <PiggyBank className="mr-3 text-indigo-600" />
                The Core Lesson: Flexibility vs. Inflexibility
              </h2>
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-red-600 font-bold text-lg border-b border-slate-100 pb-2">
                    <Lock size={20} />
                    <h3>Inflexible Burdens</h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Housing contracts and car loans lock you in. If you chose the <strong>Fancy Condo</strong> and <strong>Luxury Car</strong> initially, your fixed costs were RM 6,000.
                    When your income dropped to RM 5,000, you were instantly trapped in debt, regardless of how much you cut back on lifestyle.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-green-600 font-bold text-lg border-b border-slate-100 pb-2">
                    <Unlock size={20} />
                    <h3>Flexible Joys</h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Lifestyle choices (food, travel) are highly flexible. If you kept your fixed costs low (Basic Apartment &amp; Used Car), you could easily survive the pay cut by simply pausing your luxury lifestyle spending. You retained control over your money.
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-wider">Your Final Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">New Income</span>
                    <span className="font-bold">RM 5,000</span>
                  </div>
                  <div className="border-t border-slate-200 my-2 pt-2">
                    {Object.entries(selections).map(([key, optId]) => {
                      if (!optId) return null;
                      const opt = CATEGORIES[key as keyof typeof CATEGORIES].options.find(o => o.id === optId);
                      if (!opt) return null;
                      return (
                        <div key={key} className="flex justify-between py-1">
                          <span className="text-slate-600">{opt.label} <span className="text-xs text-slate-400">({CATEGORIES[key as keyof typeof CATEGORIES].flexible ? 'Flexible' : 'Locked'})</span></span>
                          <span className="font-medium text-red-600">- RM {opt.cost.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-3 text-base">
                    <span className="font-bold text-slate-800">Final Balance</span>
                    <span className={`font-black ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      RM {balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center pt-4">
              <button
                onClick={resetGame}
                className="px-8 py-3 bg-slate-100 text-slate-700 rounded-full font-bold hover:bg-slate-200 transition-colors flex items-center space-x-2"
              >
                <RefreshCcw size={18} />
                <span>Play Again</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
