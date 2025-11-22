import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert
} from '@mui/material';
import PageCard from '../../../components/shared/PageCard';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Savings as SavingsIcon,
  Receipt as TransactionIcon
} from '@mui/icons-material';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  tags?: string[];
  notes?: string;
}

interface BudgetCategory {
  name: string;
  budgeted: number;
  spent: number;
  type: 'expense' | 'income';
}

const FinancePage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

  const expenseCategories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Education', 'Travel',
    'Home & Garden', 'Personal Care', 'Gifts & Donations', 'Other'
  ];

  const incomeCategories = [
    'Salary', 'Freelance', 'Business', 'Investments', 
    'Rental Income', 'Gifts', 'Other Income'
  ];

  useEffect(() => {
    loadTransactionsForMonth(selectedMonth);
  }, [selectedMonth]);

  const loadTransactionsForMonth = (month: string) => {
    const storedTransactions = localStorage.getItem(`finance-transactions-${month}`);
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      setTransactions([]);
    }
  };

  const saveTransaction = (transaction: Transaction) => {
    const updatedTransactions = currentTransaction
      ? transactions.map(t => t.id === transaction.id ? transaction : t)
      : [...transactions, { ...transaction, id: Date.now().toString() }];
    
    setTransactions(updatedTransactions);
    localStorage.setItem(`finance-transactions-${selectedMonth}`, JSON.stringify(updatedTransactions));
    setOpenTransactionDialog(false);
    setCurrentTransaction(null);
  };

  const deleteTransaction = (transactionId: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== transactionId);
    setTransactions(updatedTransactions);
    localStorage.setItem(`finance-transactions-${selectedMonth}`, JSON.stringify(updatedTransactions));
  };

  const createNewTransaction = (type: 'income' | 'expense') => {
    setCurrentTransaction({
      id: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      type,
      category: type === 'expense' ? expenseCategories[0] : incomeCategories[0]
    });
    setOpenTransactionDialog(true);
  };

  const editTransaction = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setOpenTransactionDialog(true);
  };

  const getMonthStats = () => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netIncome = income - expenses;
    const transactionCount = transactions.length;

    return { income, expenses, netIncome, transactionCount };
  };

  const getBudgetByCategory = (): BudgetCategory[] => {
    const categories: { [key: string]: BudgetCategory } = {};

    // Initialize expense categories
    expenseCategories.forEach(cat => {
      categories[cat] = { name: cat, budgeted: 0, spent: 0, type: 'expense' };
    });

    // Initialize income categories
    incomeCategories.forEach(cat => {
      categories[cat] = { name: cat, budgeted: 0, spent: 0, type: 'income' };
    });

    // Calculate actual spending/income
    transactions.forEach(transaction => {
      if (categories[transaction.category]) {
        if (transaction.type === 'expense') {
          categories[transaction.category].spent += transaction.amount;
        } else {
          categories[transaction.category].spent += transaction.amount;
        }
      }
    });

    return Object.values(categories).filter(cat => cat.spent > 0);
  };

  const stats = getMonthStats();
  const budgetCategories = getBudgetByCategory();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTransactionColor = (type: string) => {
    return type === 'income' ? 'success' : 'error';
  };

  return (
    <PageCard title="Finance">
      {/* Month Selector */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <Typography variant="h6" sx={{ ml: 2 }}>
              {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 2, 
        mb: 3 
      }}>
        <Card sx={{ borderRadius: 3, bgcolor: 'success.50', borderColor: 'success.200', border: 1 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <IncomeIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h5" color="success.main" sx={{ fontWeight: 700 }}>
              {formatCurrency(stats.income)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Income
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ borderRadius: 3, bgcolor: 'error.50', borderColor: 'error.200', border: 1 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <ExpenseIcon color="error" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h5" color="error.main" sx={{ fontWeight: 700 }}>
              {formatCurrency(stats.expenses)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Expenses
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ 
          borderRadius: 3, 
          bgcolor: stats.netIncome >= 0 ? 'success.50' : 'warning.50',
          borderColor: stats.netIncome >= 0 ? 'success.200' : 'warning.200',
          border: 1 
        }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <SavingsIcon 
              color={stats.netIncome >= 0 ? 'success' : 'warning'} 
              sx={{ fontSize: 32, mb: 1 }} 
            />
            <Typography 
              variant="h5" 
              color={stats.netIncome >= 0 ? 'success.main' : 'warning.main'}
              sx={{ fontWeight: 700 }}
            >
              {formatCurrency(stats.netIncome)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Net Income
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <TransactionIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
              {stats.transactionCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Transactions
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Add Transaction Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<IncomeIcon />}
          onClick={() => createNewTransaction('income')}
          sx={{ borderRadius: 3 }}
        >
          Add Income
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<ExpenseIcon />}
          onClick={() => createNewTransaction('expense')}
          sx={{ borderRadius: 3 }}
        >
          Add Expense
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        {/* Transactions List */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TransactionIcon /> Recent Transactions
            </Typography>
            
            {transactions.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No transactions recorded for this month. Start by adding your income and expenses!
              </Alert>
            ) : (
              <List>
                {transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => (
                    <ListItem
                      key={transaction.id}
                      sx={{
                        mb: 1,
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        border: 1,
                        borderColor: 'divider'
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {transaction.description}
                            </Typography>
                            <Chip
                              label={formatCurrency(transaction.amount)}
                              color={getTransactionColor(transaction.type) as any}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                            </Typography>
                            {transaction.notes && (
                              <Typography variant="caption" color="text.secondary">
                                {transaction.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton onClick={() => editTransaction(transaction)} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => deleteTransaction(transaction.id)} 
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Category Breakdown
            </Typography>
            
            {budgetCategories.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No categories with transactions yet.
              </Typography>
            ) : (
              <List dense>
                {budgetCategories
                  .sort((a, b) => b.spent - a.spent)
                  .map((category, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={category.name}
                        secondary={
                          <Chip
                            label={formatCurrency(category.spent)}
                            color={category.type === 'income' ? 'success' : 'error'}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                  ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>


      {/* Transaction Dialog */}
      <TransactionDialog
        open={openTransactionDialog}
        transaction={currentTransaction}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        onSave={saveTransaction}
        onClose={() => {
          setOpenTransactionDialog(false);
          setCurrentTransaction(null);
        }}
      />
    </PageCard>
  );
};

// Transaction Dialog Component
interface TransactionDialogProps {
  open: boolean;
  transaction: Transaction | null;
  expenseCategories: string[];
  incomeCategories: string[];
  onSave: (transaction: Transaction) => void;
  onClose: () => void;
}

const TransactionDialog: React.FC<TransactionDialogProps> = ({
  open,
  transaction,
  expenseCategories,
  incomeCategories,
  onSave,
  onClose
}) => {
  const [transactionData, setTransactionData] = useState<Transaction>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: 'expense',
    category: ''
  });

  useEffect(() => {
    if (transaction) {
      setTransactionData(transaction);
    } else {
      setTransactionData({
        id: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        type: 'expense',
        category: expenseCategories[0]
      });
    }
  }, [transaction, expenseCategories]);

  const handleSave = () => {
    if (!transactionData.description.trim() || transactionData.amount <= 0) return;
    onSave(transactionData);
  };

  const categories = transactionData.type === 'expense' ? expenseCategories : incomeCategories;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {transaction ? 'Edit Transaction' : `New ${transactionData.type === 'income' ? 'Income' : 'Expense'}`}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            type="date"
            label="Date"
            value={transactionData.date}
            onChange={(e) => setTransactionData({ ...transactionData, date: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Description"
            value={transactionData.description}
            onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
            fullWidth
          />
          
          <TextField
            label="Amount"
            type="number"
            value={transactionData.amount}
            onChange={(e) => setTransactionData({ ...transactionData, amount: parseFloat(e.target.value) || 0 })}
            fullWidth
            inputProps={{ step: 0.01, min: 0 }}
          />

          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={transactionData.type}
              onChange={(e) => {
                const newType = e.target.value as 'income' | 'expense';
                const newCategories = newType === 'expense' ? expenseCategories : incomeCategories;
                setTransactionData({ 
                  ...transactionData, 
                  type: newType,
                  category: newCategories[0]
                });
              }}
            >
              <MenuItem value="expense">Expense</MenuItem>
              <MenuItem value="income">Income</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={transactionData.category}
              onChange={(e) => setTransactionData({ ...transactionData, category: e.target.value })}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Notes"
            value={transactionData.notes || ''}
            onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!transactionData.description.trim() || transactionData.amount <= 0}
        >
          Save Transaction
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinancePage;
