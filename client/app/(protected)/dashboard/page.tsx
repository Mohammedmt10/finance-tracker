/**
 * Dashboard Page — Finance Tracker Home
 *
 * Features:
 * - Summary cards (total income, total expense, net balance)
 * - Add Transaction form (type, category, description, amount, tags)
 * - Transactions list with filters (type, category, tag, date range), sorting, and pagination
 *
 * All data comes from: GET /transaction, POST /transaction, GET /tag, GET /transaction/categories
 */

"use client";

import React, { useState, useEffect, useCallback, FormEvent } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  ArrowUpDown,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import TagInput from "@/components/ui/TagInput";

/* ── Types ── */
interface Transaction {
  _id: string;
  amount: number;
  type: "Income" | "Expense";
  category: string;
  tags: string[];
  description?: string;
  date: string;
}

interface PaginationMeta {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface TagOption {
  _id: string;
  name: string;
}

interface Categories {
  income: string[];
  expense: string[];
}

/* ── Constants ── */
const PAGE_SIZE = 10;

export default function DashboardPage() {
  /* ────────────────────────────────────
     STATE
     ──────────────────────────────────── */

  // Transaction list
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    totalRecords: 0,
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [listLoading, setListLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState<"" | "Income" | "Expense">("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Current page
  const [page, setPage] = useState(1);

  // Add transaction form
  const [txType, setTxType] = useState<"Income" | "Expense">("Income");
  const [txCategory, setTxCategory] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txTags, setTxTags] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  // Categories (fetched from API)
  const [categories, setCategories] = useState<Categories>({
    income: [],
    expense: [],
  });

  // User's dynamic tags (fetched from API)
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);

  // Summary (calculated from a full query — separate call)
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [summaryLoading, setSummaryLoading] = useState(true);

  /* ────────────────────────────────────
     FETCH CATEGORIES
     ──────────────────────────────────── */
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get("/transaction/categories");
        setCategories(res.data);
        // Set default category for the form
        if (res.data.income.length > 0) {
          setTxCategory(res.data.income[0]);
        }
      } catch {
        console.error("Failed to load categories");
      }
    }
    loadCategories();
  }, []);

  /* ────────────────────────────────────
     FETCH TAGS
     ──────────────────────────────────── */
  const fetchTags = useCallback(async () => {
    try {
      const res = await api.get("/tag");
      setAvailableTags(res.data.data);
    } catch {
      console.error("Failed to load tags");
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  /* ────────────────────────────────────
     FETCH TRANSACTIONS
     ──────────────────────────────────── */
  const fetchTransactions = useCallback(async () => {
    setListLoading(true);

    try {
      const params: Record<string, string | number> = {
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortOrder,
      };
      if (filterType) params.type = filterType;
      if (filterCategory) params.category = filterCategory;
      if (filterTag) params.tag = filterTag;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get("/transaction", { params });

      setTransactions(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error("Failed to load transactions.");
    } finally {
      setListLoading(false);
    }
  }, [page, sortBy, sortOrder, filterType, filterCategory, filterTag, startDate, endDate]);

  /* ────────────────────────────────────
     FETCH SUMMARY (all transactions)
     ──────────────────────────────────── */
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);

    try {
      // Fetch all income
      const incomeRes = await api.get("/transaction", {
        params: { type: "Income", limit: 999999, page: 1 },
      });
      const income = (incomeRes.data.data as Transaction[]).reduce(
        (sum, t) => sum + t.amount,
        0,
      );

      // Fetch all expense
      const expenseRes = await api.get("/transaction", {
        params: { type: "Expense", limit: 999999, page: 1 },
      });
      const expense = (expenseRes.data.data as Transaction[]).reduce(
        (sum, t) => sum + t.amount,
        0,
      );

      setTotalIncome(income);
      setTotalExpense(expense);
    } catch (error) {
      console.log(error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, totalIncome, totalExpense]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, totalIncome, totalExpense]);

  /* ────────────────────────────────────
     SYNC CATEGORY ON TYPE CHANGE
     ──────────────────────────────────── */
  useEffect(() => {
    const list =
      txType === "Income" ? categories.income : categories.expense;
    if (list.length > 0) {
      setTxCategory(list[0]);
    } else {
      setTxCategory("");
    }
  }, [txType, categories]);

  /* ────────────────────────────────────
     ADD TRANSACTION
     ──────────────────────────────────── */
  async function handleAddTransaction(e: FormEvent) {
    e.preventDefault();

    const amount = parseFloat(txAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }

    if (!txCategory) {
      toast.error("Please select a category.");
      return;
    }

    setAddLoading(true);

    try {
      await api.post("/transaction", {
        type: txType,
        category: txCategory,
        description: txDescription || undefined,
        amount,
        tags: txTags,
      });

      toast.success("Transaction added!");

      // Reset form
      setTxDescription("");
      setTxAmount("");
      setTxTags([]);

      // Refresh data
      setPage(1);
      fetchSummary();
      fetchTags(); // Refresh tags in case new ones were auto-created
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to add transaction.";
      toast.error(msg);
    } finally {
      setAddLoading(false);
    }
  }

  /* ────────────────────────────────────
     CREATE TAG (from TagInput)
     ──────────────────────────────────── */
  async function handleCreateTag(name: string) {
    try {
      await api.post("/tag", { name });
      fetchTags();
    } catch {
      // Tag might already exist — that's fine, we still add it locally
    }
  }

  /* ────────────────────────────────────
     HELPERS
     ──────────────────────────────────── */
  function resetFilters() {
    setFilterType("");
    setFilterCategory("");
    setFilterTag("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  const netBalance = totalIncome - totalExpense;

  // Current category list based on selected filter type
  const filterCategoryList =
    filterType === "Income"
      ? categories.income
      : filterType === "Expense"
        ? categories.expense
        : [...new Set([...categories.income, ...categories.expense])];

  // Current category list for the add-transaction form
  const txCategoryList =
    txType === "Income" ? categories.income : categories.expense;

  /* ────────────────────────────────────
     RENDER
     ──────────────────────────────────── */
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Track your income and expenses at a glance
        </p>
      </div>

      {/* ═══════════════════════════════════
          SUMMARY CARDS
         ═══════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
            <TrendingUp className="text-green-400" size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Income</p>
            {summaryLoading ? (
              <div className="h-7 w-24 rounded bg-surface-700 animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-green-400">
                {formatCurrency(totalIncome)}
              </p>
            )}
          </div>
        </Card>

        {/* Total Expense */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
            <TrendingDown className="text-red-400" size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Expenses</p>
            {summaryLoading ? (
              <div className="h-7 w-24 rounded bg-surface-700 animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-red-400">
                {formatCurrency(totalExpense)}
              </p>
            )}
          </div>
        </Card>

        {/* Net Balance */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/15 flex items-center justify-center shrink-0">
            <DollarSign className="text-primary-400" size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-400">Net Balance</p>
            {summaryLoading ? (
              <div className="h-7 w-24 rounded bg-surface-700 animate-pulse" />
            ) : (
              <p
                className={`text-xl font-bold ${
                  netBalance >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {formatCurrency(netBalance)}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* ═══════════════════════════════════
          ADD TRANSACTION FORM
         ═══════════════════════════════════ */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
          <Plus size={20} className="text-primary-400" />
          Add Transaction
        </h2>

        <form
          onSubmit={handleAddTransaction}
          className="space-y-4"
        >
          {/* Row 1: Type + Category + Description + Amount */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Type toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Type</label>
              <div className="flex rounded-xl overflow-hidden border border-surface-600">
                <button
                  type="button"
                  onClick={() => setTxType("Income")}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                    txType === "Income"
                      ? "bg-green-600 text-white"
                      : "bg-surface-800 text-slate-400 hover:bg-surface-700"
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("Expense")}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                    txType === "Expense"
                      ? "bg-red-600 text-white"
                      : "bg-surface-800 text-slate-400 hover:bg-surface-700"
                  }`}
                >
                  Expense
                </button>
              </div>
            </div>

            {/* Category dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">
                Category
              </label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="
                  rounded-xl bg-surface-800 border border-surface-600
                  text-slate-100 px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50
                  transition-all duration-200
                "
              >
                {txCategoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <Input
              label="Description"
              placeholder="e.g. Salary, Groceries…"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
            />

            {/* Amount */}
            <Input
              label="Amount"
              type="number"
              placeholder="0.00"
              min="1"
              step="0.01"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              required
              icon={<DollarSign size={16} />}
            />
          </div>

          {/* Row 2: Tags + Submit */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
            {/* Tags */}
            <TagInput
              label="Tags"
              value={txTags}
              availableTags={availableTags}
              onChange={setTxTags}
              onCreateTag={handleCreateTag}
              max={10}
            />

            {/* Submit */}
            <Button
              type="submit"
              isLoading={addLoading}
              className="w-full md:w-auto"
            >
              <Plus size={18} />
              Add
            </Button>
          </div>
        </form>
      </Card>

      {/* ═══════════════════════════════════
          RECENT TRANSACTIONS
         ═══════════════════════════════════ */}
      <Card>
        {/* Header row with title and filter toggle */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            Recent Transactions
          </h2>
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
              bg-surface-700 text-slate-300 hover:bg-surface-600
              transition-colors duration-200
            "
          >
            <Filter size={14} />
            Filters
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* ── Filters panel ── */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 rounded-xl bg-surface-800/60 animate-scale-in">
            {/* Type filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Type</label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as "" | "Income" | "Expense");
                  setFilterCategory(""); // reset category when type changes
                  setPage(1);
                }}
                className="
                  rounded-xl bg-surface-800 border border-surface-600
                  text-slate-100 px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50
                  transition-all duration-200
                "
              >
                <option value="">All</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>

            {/* Category filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setPage(1);
                }}
                className="
                  rounded-xl bg-surface-800 border border-surface-600
                  text-slate-100 px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50
                  transition-all duration-200
                "
              >
                <option value="">All</option>
                {filterCategoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Tag</label>
              <select
                value={filterTag}
                onChange={(e) => {
                  setFilterTag(e.target.value);
                  setPage(1);
                }}
                className="
                  rounded-xl bg-surface-800 border border-surface-600
                  text-slate-100 px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50
                  transition-all duration-200
                "
              >
                <option value="">All</option>
                {availableTags.map((tag) => (
                  <option key={tag._id} value={tag.name}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">
                From Date
              </label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="
                    w-full rounded-xl bg-surface-800 border border-surface-600
                    text-slate-100 pl-10 pr-4 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary-500/50
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* End date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">
                To Date
              </label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="
                    w-full rounded-xl bg-surface-800 border border-surface-600
                    text-slate-100 pl-10 pr-4 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary-500/50
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Reset filters */}
            <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
        )}

        {/* ── Sort header row ── */}
        <div className="hidden sm:grid grid-cols-5 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-4">
          <button
            onClick={() => toggleSort("type")}
            className="flex items-center gap-1 hover:text-slate-300 transition-colors text-left"
          >
            Type
            {sortBy === "type" && (
              <ArrowUpDown size={12} className="text-primary-400" />
            )}
          </button>

          <button
            onClick={() => toggleSort("category")}
            className="flex items-center gap-1 hover:text-slate-300 transition-colors text-left"
          >
            Category
            {sortBy === "category" && (
              <ArrowUpDown size={12} className="text-primary-400" />
            )}
          </button>

          <button
            onClick={() => toggleSort("description")}
            className="flex items-center gap-1 hover:text-slate-300 transition-colors text-left"
          >
            Description
          </button>

          <button
            onClick={() => toggleSort("amount")}
            className="flex items-center gap-1 hover:text-slate-300 transition-colors text-left"
          >
            Amount
            {sortBy === "amount" && (
              <ArrowUpDown size={12} className="text-primary-400" />
            )}
          </button>

          <button
            onClick={() => toggleSort("date")}
            className="flex items-center gap-1 hover:text-slate-300 transition-colors text-left"
          >
            Date
            {sortBy === "date" && (
              <ArrowUpDown size={12} className="text-primary-400" />
            )}
          </button>
        </div>

        {/* ── Transaction rows ── */}
        {listLoading ? (
          <div className="py-12">
            <Spinner size={32} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No transactions found. Add your first one above!
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx._id}
                className="
                  grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-4
                  items-center px-4 py-3 rounded-xl
                  bg-surface-800/40 hover:bg-surface-800/70
                  transition-colors duration-200
                "
              >
                {/* Type badge */}
                <div>
                  <span
                    className={`
                      inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
                      ${
                        tx.type === "Income"
                          ? "bg-green-500/15 text-green-400"
                          : "bg-red-500/15 text-red-400"
                      }
                    `}
                  >
                    {tx.type === "Income" ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {tx.type}
                  </span>
                </div>

                {/* Category */}
                <div>
                  <span
                    className="
                      inline-flex items-center gap-1 px-2.5 py-1
                      rounded-lg text-xs font-medium
                      bg-surface-700/60 text-slate-300
                    "
                  >
                    {tx.category}
                  </span>
                </div>

                {/* Description + Tags */}
                <div className="space-y-1">
                  <p className="text-sm text-slate-300 truncate">
                    {tx.description || "—"}
                  </p>
                  {tx.tags && tx.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tx.tags.map((tag) => (
                        <span
                          key={tag}
                          className="
                            inline-flex items-center gap-0.5 px-1.5 py-0.5
                            rounded text-[10px] font-medium
                            bg-primary-600/15 text-primary-300
                          "
                        >
                          <Tag size={8} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amount */}
                <p
                  className={`text-sm font-semibold ${
                    tx.type === "Income" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {tx.type === "Income" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </p>

                {/* Date */}
                <p className="text-sm text-slate-500">{formatDate(tx.date)}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
