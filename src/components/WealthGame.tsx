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
          ${isSelected ? 'border-primary/20 bg-background shadow-md' : 'border-primary/20 bg-white hover:border-primary/20'}
          ${isLocked ? 'opacity-60 cursor-not-allowed grayscale-[50%]' : 'cursor-pointer'}
        `}
      >
        {isLocked && (
          <div className="absolute top-2 right-2 text-danger flex items-center bg-danger/5 px-2 py-1 rounded text-xs font-medium">
            <Lock size={12} className="mr-1" /> Locked
          </div>
        )}
        {gameState === 'adjusting' && category.flexible && (
          <div className="absolute top-2 right-2 text-primary flex items-center bg-accent/10 px-2 py-1 rounded text-xs font-medium">
            <Unlock size={12} className="mr-1" /> Flexible
          </div>
        )}
        <div className="flex justify-between items-center mb-2">
          <h4 className={`font-medium ${isSelected ? 'text-primary' : 'text-primary'}`}>{option.label}</h4>
          <span className={`font-medium ${isSelected ? 'text-primary' : 'text-primary/70'}`}>
            RM {option.cost.toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-primary/70">{option.desc}</p>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background text-primary selection:bg-accent/40">
      {gameState !== 'intro' && gameState !== 'shock_reveal' && (
        <div className={`sticky top-24 z-40 transition-colors duration-500 shadow-sm
          ${gameState === 'adjusting' ? 'bg-danger text-white' : 'bg-white text-primary'}`}>
          <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <Wallet className={gameState === 'adjusting' ? 'text-white' : 'text-primary'} />
              <div>
                <p className={`text-xs uppercase font-medium ${gameState === 'adjusting' ? 'text-danger/80' : 'text-primary/70'}`}>
                  Monthly Income
                </p>
                <p className="text-xl font-medium">RM {income.toLocaleString()}</p>
              </div>
            </div>
            {gameState === 'adjusting' && (
              <div className="flex items-center space-x-3 bg-danger px-4 py-2 rounded-lg animate-pulse">
                <AlertTriangle size={24} className="text-accent" />
                <div className="text-center">
                  <p className="text-xs uppercase font-medium text-danger/80">Time to adjust</p>
                  <p className="text-xl font-medium tabular-nums">{timeLeft}s</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className={`text-xs uppercase font-medium ${gameState === 'adjusting' ? 'text-danger/80' : 'text-primary/70'}`}>Expenses</p>
                <p className="text-lg font-medium">RM {totalExpenses.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase font-medium ${gameState === 'adjusting' ? 'text-danger/80' : 'text-primary/70'}`}>Leftover (Savings)</p>
                <p className={`text-lg font-medium ${balance < 0 ? 'text-danger/80' : (gameState === 'adjusting' ? 'text-white' : 'text-primary')}`}>
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
            <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mb-4">
              <TrendingDown size={48} className="text-primary" />
            </div>
            <h1 className="text-5xl font-medium tracking-tight text-primary">
              The &quot;Life Shock&quot; Game
            </h1>
            <p className="text-xl text-primary/70 leading-relaxed">
              Congratulations! You just landed a fantastic job earning <strong className="text-primary bg-accent/10 px-2 py-1 rounded">RM 10,000</strong> a month.
              <br /><br />
              It&apos;s time to build your lifestyle. How will you allocate your newfound wealth?
            </p>
            <button
              onClick={() => setGameState('budgeting')}
              className="px-8 py-4 bg-primary text-white rounded-full font-medium text-lg hover:bg-primary transition-transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <span>Start Budgeting</span>
              <Wallet size={20} />
            </button>
          </div>
        )}

        {(gameState === 'budgeting' || gameState === 'adjusting') && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-medium text-primary">
                {gameState === 'budgeting' ? 'Design Your Lifestyle' : 'Emergency Restructuring!'}
              </h2>
              <p className="text-primary/70 mt-2">
                {gameState === 'budgeting'
                  ? 'Choose your housing, transport, and lifestyle options below.'
                  : 'Adjust what you can before time runs out! Look for the flexible options.'}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {Object.values(CATEGORIES).map(category => {
                const CategoryIcon = category.icon;
                return (
                <div key={category.id} className="bg-white p-6 rounded-2xl shadow-sm border border-primary/20 flex flex-col">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-background rounded-lg text-primary">
                      <CategoryIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{category.title}</h3>
                      <p className="text-xs text-primary/70">{category.description}</p>
                    </div>
                  </div>
                  <div className="space-y-3 flex-grow">
                    {category.options.map(option => (
                      <OptionCard key={option.id} category={category} option={option} />
                    ))}
                  </div>
                  {gameState === 'adjusting' && !category.flexible && (
                    <div className="mt-4 p-3 bg-danger/5 border border-danger/40 rounded-lg text-sm text-danger flex items-start space-x-2">
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
                  className={`px-10 py-4 rounded-full font-medium text-lg transition-all flex items-center space-x-2
                    ${isBudgetComplete
                      ? 'bg-primary text-white hover:bg-primary shadow-lg hover:shadow-xl hover:-translate-y-1'
                      : 'bg-background text-primary/70 cursor-not-allowed'}`}
                >
                  <CheckCircle2 size={24} />
                  <span>Confirm Budget</span>
                </button>
              ) : (
                <button
                  onClick={finishGame}
                  className="px-10 py-4 bg-accent text-white rounded-full font-medium text-lg hover:bg-accent shadow-lg transition-transform hover:scale-105 flex items-center space-x-2"
                >
                  <CheckCircle2 size={24} />
                  <span>I&apos;m Done Adjusting</span>
                </button>
              )}
            </div>
          </div>
        )}

        {gameState === 'shock_reveal' && (
          <div className="fixed inset-0 bg-danger z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white p-10 rounded-3xl max-w-2xl w-full text-center shadow-2xl transform transition-all scale-100 animate-in zoom-in-90 duration-500">
              <div className="w-24 h-24 bg-danger/5 text-danger rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <AlertTriangle size={48} />
              </div>
              <h1 className="text-5xl font-medium text-primary mb-4 uppercase tracking-tight">Life Shock!</h1>
              <h2 className="text-3xl font-medium text-danger mb-6">A recession just hit.</h2>
              <p className="text-xl text-primary mb-8">
                Your company is downsizing. Your salary has been cut by 50%.<br />
                You now only earn <strong>RM 5,000</strong> a month.
              </p>
              <div className="inline-block bg-background px-6 py-3 rounded-lg text-primary/70 font-medium">
                You have 30 seconds to adjust your budget to survive.
              </div>
            </div>
          </div>
        )}

        {gameState === 'results' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className={`p-8 rounded-3xl text-center shadow-lg border-2 ${balance >= 0 ? 'bg-accent/10 border-accent/60 text-primary' : 'bg-danger/5 border-danger/40 text-danger'}`}>
              <div className="flex justify-center mb-4">
                {balance >= 0 ? <CheckCircle2 size={64} className="text-primary" /> : <XCircle size={64} className="text-danger" />}
              </div>
              <h1 className="text-4xl font-medium mb-2">
                {balance >= 0 ? 'You Survived!' : 'You Went Into Debt!'}
              </h1>
              <p className="text-xl opacity-90">
                Your final balance is <strong className="font-medium">RM {balance.toLocaleString()}</strong>
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-primary/20">
              <h2 className="text-2xl font-medium text-primary mb-6 flex items-center">
                <PiggyBank className="mr-3 text-primary" />
                The Core Lesson: Flexibility vs. Inflexibility
              </h2>
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-danger font-medium text-lg border-b border-primary/20 pb-2">
                    <Lock size={20} />
                    <h3>Inflexible Burdens</h3>
                  </div>
                  <p className="text-primary/70 leading-relaxed">
                    Housing contracts and car loans lock you in. If you chose the <strong>Fancy Condo</strong> and <strong>Luxury Car</strong> initially, your fixed costs were RM 6,000.
                    When your income dropped to RM 5,000, you were instantly trapped in debt, regardless of how much you cut back on lifestyle.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-primary font-medium text-lg border-b border-primary/20 pb-2">
                    <Unlock size={20} />
                    <h3>Flexible Joys</h3>
                  </div>
                  <p className="text-primary/70 leading-relaxed">
                    Lifestyle choices (food, travel) are highly flexible. If you kept your fixed costs low (Basic Apartment &amp; Used Car), you could easily survive the pay cut by simply pausing your luxury lifestyle spending. You retained control over your money.
                  </p>
                </div>
              </div>
              <div className="bg-background p-6 rounded-2xl border border-primary/20">
                <h3 className="font-medium text-primary mb-4 uppercase text-sm tracking-wider">Your Final Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary/70">New Income</span>
                    <span className="font-medium">RM 5,000</span>
                  </div>
                  <div className="border-t border-primary/20 my-2 pt-2">
                    {Object.entries(selections).map(([key, optId]) => {
                      if (!optId) return null;
                      const opt = CATEGORIES[key as keyof typeof CATEGORIES].options.find(o => o.id === optId);
                      if (!opt) return null;
                      return (
                        <div key={key} className="flex justify-between py-1">
                          <span className="text-primary/70">{opt.label} <span className="text-xs text-primary/70">({CATEGORIES[key as keyof typeof CATEGORIES].flexible ? 'Flexible' : 'Locked'})</span></span>
                          <span className="font-medium text-danger">- RM {opt.cost.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between border-t border-primary/20 pt-3 text-base">
                    <span className="font-medium text-primary">Final Balance</span>
                    <span className={`font-medium ${balance >= 0 ? 'text-primary' : 'text-danger'}`}>
                      RM {balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center pt-4">
              <button
                onClick={resetGame}
                className="px-8 py-3 bg-background text-primary rounded-full font-medium hover:bg-background transition-colors flex items-center space-x-2"
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
