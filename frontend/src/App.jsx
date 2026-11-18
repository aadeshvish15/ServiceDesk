import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
  useOutletContext,
} from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FilePlus2,
  Headphones,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldCheck,
  Ticket,
  Users,
  Wrench,
} from "lucide-react";
import api from "./api/client";
import { useAuth } from "./auth/AuthContext";

const roleLabels = {
  ADMIN: "Administrator",
  AGENT: "Support Agent",
  EMPLOYEE: "Employee",
};
const statusOptions = ["OPEN", "IN_PROGRESS", "PENDING", "RESOLVED", "CLOSED"];
const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function errorText(error) {
  return (
    error?.userMessage ||
    error?.response?.data?.message ||
    "Something went wrong. Please try again."
  );
}
function dateText(value) {
  return value ? new Date(value).toLocaleString() : "—";
}
function dateShort(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}
function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}
function statusClass(status = "") {
  return `pill status-${status.toLowerCase()}`;
}
function priorityClass(priority = "") {
  return `pill priority-${priority.toLowerCase()}`;
}

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="center-screen">
        <div className="loader" />
      </div>
    );
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function AppShell() {
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const refreshUnread = useCallback(() => {
    api
      .get("/notifications/unread-count")
      .then(({ data }) => setUnread(data.unreadCount || 0))
      .catch(() => setUnread(0));
  }, []);
  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  const links = [
    { to: "/", label: "Overview", icon: LayoutDashboard },
    {
      to: "/tickets",
      label: user.role === "EMPLOYEE" ? "My requests" : "Ticket queue",
      icon: Ticket,
    },
    { to: "/notifications", label: "Notifications", icon: Bell, count: unread },
    ...(user.role === "ADMIN"
      ? [{ to: "/admin", label: "Administration", icon: ShieldCheck }]
      : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Headphones size={21} />
          </span>
          <span>
            Service<span className="brand-accent">Desk</span>
            <small>IT SUPPORT PORTAL</small>
          </span>
        </Link>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon, count }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `nav-link ${
                  isActive ||
                  (to === "/tickets" &&
                    window.location.pathname.startsWith("/tickets"))
                    ? "active"
                    : ""
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
              {count > 0 && <em>{count}</em>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <CircleHelp size={17} />
            </div>
            <strong>Need a hand?</strong>
            <p>Raise a request and our team will help you out.</p>
            <Link to={user.role === "EMPLOYEE" ? "/tickets/new" : "/tickets"}>
              Get support <span>→</span>
            </Link>
          </div>
          <div className="profile-mini">
            <div className="avatar">{initials(user.name)}</div>
            <div className="profile-copy">
              <strong>{user.name}</strong>
              <span>{roleLabels[user.role] || user.role}</span>
            </div>
            <button
              className="icon-btn logout-btn"
              title="Sign out"
              onClick={handleLogout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>
              {links.find((item) => item.to === window.location.pathname)
                ?.label || "ServiceDesk"}
            </strong>
          </div>
          <div className="top-actions">
            <span className="system-status">
              <i /> All systems operational
            </span>
            <button
              className="icon-btn top-bell"
              onClick={() => navigate("/notifications")}
              title="Notifications"
            >
              <Bell size={19} />
              {unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}
            </button>
            <div className="top-user">
              <div className="avatar small">{initials(user.name)}</div>
              <span>{user.name}</span>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>
        <div className="page-wrap">
          <Outlet context={{ refreshUnread }} />
        </div>
      </main>
    </div>
  );
}

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthFrame mode="login">
      <form onSubmit={submit} className="auth-form">
        <div>
          <label>Email address</label>
          <input
            type="email"
            autoComplete="username"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        <button className="btn btn-primary btn-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in to ServiceDesk"}
        </button>
        <p className="auth-foot">
          New to ServiceDesk?{" "}
          <Link to="/register">Create an employee account</Link>
        </p>
      </form>
    </AuthFrame>
  );
}

function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(form);
      navigate("/");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthFrame mode="register">
      <form onSubmit={submit} className="auth-form">
        <div>
          <label>Full name</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
            required
            maxLength={100}
          />
        </div>
        <div>
          <label>Work email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
            maxLength={72}
            required
          />
        </div>
        <div className="hint">
          Public registration creates an Employee account. Admins can create
          support agents.
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        <button className="btn btn-primary btn-full" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
        <p className="auth-foot">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthFrame>
  );
}

function AuthFrame({ children, mode }) {
  return (
    <div className="auth-layout">
      <section className="auth-visual">
        <div className="auth-brand">
          <span className="brand-icon">
            <Headphones size={23} />
          </span>
          Service<span className="brand-accent">Desk</span>
        </div>
        <div className="auth-visual-content">
          <span className="eyebrow">SUPPORT THAT MOVES YOU FORWARD</span>
          <h1>
            Every issue.
            <br />
            One clear <em>solution.</em>
          </h1>
          <p>
            Track requests, collaborate with support agents and keep every
            service commitment on schedule.
          </p>
          <div className="visual-stats">
            <div>
              <strong>24/7</strong>
              <span>Request tracking</span>
            </div>
            <div>
              <strong>3 roles</strong>
              <span>One workspace</span>
            </div>
            <div>
              <strong>SLA</strong>
              <span>Accountability</span>
            </div>
          </div>
        </div>
        <div className="auth-visual-footer">IT HELPDESK & SLA MANAGEMENT</div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="mobile-auth-brand">
            <Headphones size={22} /> ServiceDesk
          </div>
          <span className="eyebrow">
            {mode === "login" ? "WELCOME BACK" : "GET STARTED"}
          </span>
          <h2>
            {mode === "login"
              ? "Sign in to your workspace"
              : "Create your account"}
          </h2>
          <p className="muted">
            {mode === "login"
              ? "Enter your credentials to continue."
              : "Register as an employee to raise and track requests."}
          </p>
          {children}
        </div>
      </section>
    </div>
  );
}

function PageTitle({ eyebrow, title, subtitle, action }) {
  return (
    <div className="page-title-row">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
function ErrorBox({ children }) {
  return (
    <div className="error-box">
      <AlertCircle size={16} />
      <span>{children}</span>
    </div>
  );
}
function Loading() {
  return (
    <div className="loading-inline">
      <div className="loader small-loader" /> Loading your workspace…
    </div>
  );
}
function EmptyState({ title, subtitle, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Ticket size={25} />
      </div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
      {action}
    </div>
  );
}

async function fetchRoleTickets(role) {
  const endpoint = role === "EMPLOYEE" ? "/employee/tickets" : "/agent/tickets";
  const { data } = await api.get(endpoint);
  return data;
}

function DashboardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchRoleTickets(user.role);
      setTickets(data);
      if (user.role === "ADMIN") {
        const res = await api.get("/admin/users/agents");
        setAgents(res.data);
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [user.role]);
  useEffect(() => {
    load();
  }, [load]);
  const counts = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((t) => t.status === "OPEN").length,
      progress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      pending: tickets.filter((t) => t.status === "PENDING").length,
      resolved: tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status))
        .length,
      critical: tickets.filter((t) => t.priority === "CRITICAL").length,
    }),
    [tickets]
  );
  const subtitle =
    user.role === "EMPLOYEE"
      ? "Keep track of the requests you have raised."
      : user.role === "AGENT"
      ? "Review your assigned work and requests waiting for an owner."
      : "Monitor service activity and manage your support operation.";
  return (
    <>
      <PageTitle
        eyebrow={`${roleLabels[user.role]} WORKSPACE`}
        title={`Good day, ${user.name.split(" ")[0]}`}
        subtitle={subtitle}
        action={
          user.role === "EMPLOYEE" ? (
            <Link className="btn btn-primary" to="/tickets/new">
              <Plus size={17} /> New request
            </Link>
          ) : (
            <button className="btn btn-secondary" onClick={load}>
              <RefreshCw size={16} /> Refresh
            </button>
          )
        }
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard
              icon={Ticket}
              label="Total tickets"
              value={counts.total}
              tone="blue"
              foot="Visible to your account"
            />
            <StatCard
              icon={Clock3}
              label="Open"
              value={counts.open}
              tone="amber"
              foot="Awaiting attention"
            />
            <StatCard
              icon={Activity}
              label="In progress"
              value={counts.progress}
              tone="violet"
              foot="Currently being handled"
            />
            <StatCard
              icon={CheckCircle2}
              label="Resolved / closed"
              value={counts.resolved}
              tone="green"
              foot="Completed requests"
            />
          </div>
          {user.role === "ADMIN" && (
            <div className="admin-strip">
              <div className="admin-strip-icon">
                <Users size={20} />
              </div>
              <div>
                <strong>{agents.length} active support agents</strong>
                <span>Agent accounts available for ticket assignment</span>
              </div>
              <Link className="text-link" to="/admin">
                Manage agents <span>→</span>
              </Link>
            </div>
          )}
          <div className="section-heading">
            <div>
              <h2>
                {user.role === "EMPLOYEE"
                  ? "Recent requests"
                  : "Recent ticket activity"}
              </h2>
              <p>
                {user.role === "EMPLOYEE"
                  ? "The latest updates on your requests."
                  : "Latest tickets available in your queue."}
              </p>
            </div>
            <Link to="/tickets" className="text-link">
              View all tickets <span>→</span>
            </Link>
          </div>
          <TicketTable tickets={tickets.slice(0, 6)} role={user.role} />
        </>
      )}
    </>
  );
}

function StatCard({ icon: Icon, label, value, tone, foot }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={19} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">{foot}</div>
    </div>
  );
}

function TicketTable({ tickets, role }) {
  if (!tickets.length)
    return (
      <EmptyState
        title="No tickets yet"
        subtitle={
          role === "EMPLOYEE"
            ? "Create your first support request to get started."
            : "Your ticket queue is currently clear."
        }
        action={
          role === "EMPLOYEE" ? (
            <Link to="/tickets/new" className="btn btn-primary">
              <Plus size={16} /> Create a request
            </Link>
          ) : null
        }
      />
    );
  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>{role === "EMPLOYEE" ? "Assigned to" : "Requester"}</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <Link className="ticket-link" to={`/tickets/${ticket.id}`}>
                    <span className="ticket-id">SD-{ticket.id}</span>
                    <strong>{ticket.subject}</strong>
                  </Link>
                </td>
                <td>{ticket.categoryName}</td>
                <td>
                  <span className={priorityClass(ticket.priority)}>
                    {ticket.priority}
                  </span>
                </td>
                <td>
                  <span className={statusClass(ticket.status)}>
                    {ticket.status.replace("_", " ")}
                  </span>
                </td>
                <td>
                  {role === "EMPLOYEE"
                    ? ticket.assignedToName || "Not assigned"
                    : ticket.createdByName}
                </td>
                <td>{dateShort(ticket.createdAt)}</td>
                <td>
                  <Link to={`/tickets/${ticket.id}`} className="row-arrow">
                    ↗
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTickets(await fetchRoleTickets(user.role));
      setError("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [user.role]);
  useEffect(() => {
    load();
  }, [load]);
  const filtered = tickets.filter(
    (t) =>
      (status === "ALL" || t.status === status) &&
      `${t.subject} ${t.categoryName} ${t.createdByName} SD-${t.id}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );
  return (
    <>
      <PageTitle
        eyebrow="REQUEST MANAGEMENT"
        title={user.role === "EMPLOYEE" ? "My requests" : "Ticket queue"}
        subtitle="Search, review and follow the status of support tickets."
        action={
          user.role === "EMPLOYEE" ? (
            <Link to="/tickets/new" className="btn btn-primary">
              <Plus size={17} /> New request
            </Link>
          ) : (
            <button className="btn btn-secondary" onClick={load}>
              <RefreshCw size={16} /> Refresh
            </button>
          )
        }
      />
      <div className="filters-row">
        <input
          className="search-input"
          placeholder="Search by subject, category or requester…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span className="results-count">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </span>
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      {loading ? (
        <Loading />
      ) : (
        <TicketTable tickets={filtered} role={user.role} />
      )}
    </>
  );
}

function NewTicketPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    subject: "",
    description: "",
    priority: "MEDIUM",
    categoryId: "",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/categories")
      .then(({ data }) => {
        setCategories(data);
        if (data[0]) setForm((p) => ({ ...p, categoryId: String(data[0].id) }));
      })
      .catch((e) => setError(errorText(e)))
      .finally(() => setLoading(false));
  }, []);
  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/employee/tickets", {
        ...form,
        categoryId: Number(form.categoryId),
      });
      navigate(`/tickets/${data.id}`);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Link to="/tickets" className="back-link">
        <ArrowLeft size={16} /> Back to requests
      </Link>
      <PageTitle
        eyebrow="EMPLOYEE SUPPORT"
        title="Create a support request"
        subtitle="Tell us what is happening. The support team will take it from here."
      />
      <form className="form-card ticket-form" onSubmit={submit}>
        <div className="form-section-title">
          <FilePlus2 size={19} />
          <div>
            <strong>Request details</strong>
            <span>
              Provide enough information to help us resolve the issue.
            </span>
          </div>
        </div>
        <div className="form-grid">
          <div className="field full">
            <label>Subject</label>
            <input
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              maxLength={150}
              placeholder="e.g. Laptop is not connecting to Wi-Fi"
              required
            />
          </div>
          <div className="field full">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={5000}
              rows={6}
              placeholder="Describe the issue, what you were doing and any error messages…"
              required
            />
          </div>
          <div className="field">
            <label>Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              required
              disabled={loading || !categories.length}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {!loading && !categories.length && (
              <span className="field-hint">
                No active categories are available. Ask an administrator to add
                one.
              </span>
            )}
          </div>
          <div className="field">
            <label>Priority</label>
            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
            >
              {priorities.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/tickets")}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={busy || !categories.length}
          >
            {busy ? "Submitting…" : "Submit request"} <span>→</span>
          </button>
        </div>
      </form>
    </>
  );
}

function TicketDetailPage() {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [sla, setSla] = useState(null);
  const [agents, setAgents] = useState([]);
  const [comment, setComment] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [newStatus, setNewStatus] = useState("");
  const [agentId, setAgentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isEmployee = user.role === "EMPLOYEE";
  const ticketBase = isEmployee
    ? `/employee/tickets/${ticketId}`
    : `/agent/tickets/${ticketId}`;
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const main = await api.get(ticketBase);
      setTicket(main.data);
      setNewStatus(main.data.status);
      const tasks = [
        api.get(`${ticketBase}/comments`),
        api.get(`${ticketBase}/activities`),
      ];
      if (!isEmployee) tasks.push(api.get(`${ticketBase}/sla`));
      if (user.role === "ADMIN") tasks.push(api.get("/admin/users/agents"));
      const results = await Promise.allSettled(tasks);
      setComments(
        results[0].status === "fulfilled" ? results[0].value.data : []
      );
      setActivities(
        results[1].status === "fulfilled" ? results[1].value.data : []
      );
      let index = 2;
      if (!isEmployee) {
        setSla(
          results[index]?.status === "fulfilled"
            ? results[index].value.data
            : null
        );
        index += 1;
      }
      if (user.role === "ADMIN")
        setAgents(
          results[index]?.status === "fulfilled"
            ? results[index].value.data
            : []
        );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [ticketBase, isEmployee, user.role]);
  useEffect(() => {
    load();
  }, [load]);
  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    setError("");
    try {
      const path = `${ticketBase}/comments`;
      const body = isEmployee
        ? { content: comment }
        : { content: comment, visibility };
      await api.post(path, body);
      setComment("");
      await load();
    } catch (e2) {
      setError(errorText(e2));
    } finally {
      setBusy(false);
    }
  };
  const updateStatus = async () => {
    setBusy(true);
    setError("");
    try {
      await api.patch(`/agent/tickets/${ticketId}/status`, {
        status: newStatus,
      });
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const assignTicket = async () => {
    if (!agentId) return;
    setBusy(true);
    setError("");
    try {
      await api.patch(`/admin/tickets/${ticketId}/assignment`, {
        agentId: Number(agentId),
      });
      setAgentId("");
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;
  if (error && !ticket)
    return (
      <>
        <Link className="back-link" to="/tickets">
          <ArrowLeft size={16} /> Back to tickets
        </Link>
        <ErrorBox>{error}</ErrorBox>
      </>
    );
  if (!ticket)
    return (
      <EmptyState
        title="Ticket not found"
        subtitle="This ticket may have been removed or you may not have access."
      />
    );
  return (
    <>
      <Link to="/tickets" className="back-link">
        <ArrowLeft size={16} /> Back to tickets
      </Link>
      <div className="detail-heading">
        <div>
          <div className="eyebrow">
            TICKET SD-{ticket.id} <span className="dot-sep">•</span>{" "}
            {ticket.categoryName}
          </div>
          <h1>{ticket.subject}</h1>
          <p>
            Created by {ticket.createdByName} on {dateText(ticket.createdAt)}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="detail-layout">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-head">
              <h2>Request description</h2>
              <div className="inline-pills">
                <span className={priorityClass(ticket.priority)}>
                  {ticket.priority}
                </span>
                <span className={statusClass(ticket.status)}>
                  {ticket.status.replace("_", " ")}
                </span>
              </div>
            </div>
            <p className="description-text">{ticket.description}</p>
            <div className="ticket-meta">
              <div>
                <span>Requester</span>
                <strong>{ticket.createdByName}</strong>
                <small>{ticket.createdByEmail}</small>
              </div>
              <div>
                <span>Assigned agent</span>
                <strong>{ticket.assignedToName || "Unassigned"}</strong>
                <small>
                  {ticket.assignedToEmail || "Waiting for assignment"}
                </small>
              </div>
              <div>
                <span>Last updated</span>
                <strong>{dateText(ticket.updatedAt)}</strong>
              </div>
            </div>
          </section>
          {!isEmployee && (
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title-icon">
                  <Activity size={18} />
                  <h2>Ticket controls</h2>
                </div>
              </div>
              <div className="controls-row">
                <div className="field">
                  <label>Update status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {statusOptions.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary control-button"
                  disabled={busy || newStatus === ticket.status}
                  onClick={updateStatus}
                >
                  Update status
                </button>
              </div>
              {user.role === "ADMIN" && (
                <div className="controls-row assign-row">
                  <div className="field">
                    <label>Assign / reassign agent</label>
                    <select
                      value={agentId}
                      onChange={(e) => setAgentId(e.target.value)}
                    >
                      <option value="">Select an agent</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="btn btn-secondary control-button"
                    disabled={busy || !agentId}
                    onClick={assignTicket}
                  >
                    Assign ticket
                  </button>
                </div>
              )}
            </section>
          )}
          <section className="panel">
            <div className="panel-head">
              <div className="panel-title-icon">
                <MessageSquare size={18} />
                <h2>Conversation</h2>
              </div>
              <span className="count-chip">{comments.length}</span>
            </div>
            <div className="conversation-list">
              {comments.length ? (
                comments.map((item) => (
                  <div
                    key={item.id}
                    className={`comment ${
                      item.visibility === "INTERNAL" ? "internal-comment" : ""
                    }`}
                  >
                    <div className="comment-avatar">
                      {initials(item.authorName)}
                    </div>
                    <div className="comment-content">
                      <div className="comment-head">
                        <strong>{item.authorName}</strong>
                        <span>{item.authorRole}</span>
                        {item.visibility === "INTERNAL" && (
                          <em>Internal note</em>
                        )}
                        <time>{dateText(item.createdAt)}</time>
                      </div>
                      <p>{item.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="muted-empty">
                  No messages yet. Start the conversation below.
                </div>
              )}
            </div>
            <form className="comment-form" onSubmit={addComment}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={5000}
                placeholder="Write a message…"
                required
              />
              {!isEmployee && (
                <div className="comment-form-bottom">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={visibility === "INTERNAL"}
                      onChange={(e) =>
                        setVisibility(e.target.checked ? "INTERNAL" : "PUBLIC")
                      }
                    />{" "}
                    Add as internal note
                  </label>
                  <span className="internal-help">
                    Internal notes are visible only to support staff
                  </span>
                </div>
              )}
              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  disabled={busy || !comment.trim()}
                >
                  {busy ? "Sending…" : "Send message"} <span>→</span>
                </button>
              </div>
            </form>
          </section>
        </div>
        <aside className="detail-side">
          {!isEmployee && (
            <section className="panel side-panel">
              <div className="panel-title-icon">
                <Clock3 size={18} />
                <h2>SLA tracking</h2>
              </div>
              {sla ? (
                <>
                  <SlaRow
                    label="First response"
                    due={sla.firstResponseDueAt}
                    met={sla.firstResponseMet}
                    breached={sla.firstResponseBreached}
                    actual={sla.firstRespondedAt}
                  />
                  <SlaRow
                    label="Resolution"
                    due={sla.resolutionDueAt}
                    met={sla.resolutionMet}
                    breached={sla.resolutionBreached}
                    actual={sla.resolvedAt}
                  />
                </>
              ) : (
                <p className="muted small-text">
                  SLA information is not available for this ticket.
                </p>
              )}
            </section>
          )}
          <section className="panel side-panel">
            <div className="panel-title-icon">
              <Activity size={18} />
              <h2>Activity history</h2>
            </div>
            <div className="timeline">
              {activities.length ? (
                activities.map((item) => (
                  <div className="timeline-item" key={item.id}>
                    <i className="timeline-dot" />
                    <div>
                      <strong>{item.description}</strong>
                      <span>
                        {item.performedByName} · {item.performedByRole}
                      </span>
                      <time>{dateText(item.createdAt)}</time>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted small-text">No activity recorded yet.</p>
              )}
            </div>
          </section>
          <section className="panel side-panel quick-info">
            <strong>Ticket information</strong>
            <div>
              <span>Ticket ID</span>
              <b>SD-{ticket.id}</b>
            </div>
            <div>
              <span>Priority</span>
              <b className={priorityClass(ticket.priority)}>
                {ticket.priority}
              </b>
            </div>
            <div>
              <span>Created</span>
              <b>{dateShort(ticket.createdAt)}</b>
            </div>
            <div>
              <span>First response due</span>
              <b>{dateShort(ticket.firstResponseDueAt)}</b>
            </div>
            <div>
              <span>Resolution due</span>
              <b>{dateShort(ticket.resolutionDueAt)}</b>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function SlaRow({ label, due, met, breached, actual }) {
  const state = breached ? "Breached" : met ? "Met" : "Pending";
  return (
    <div className="sla-row">
      <div className="sla-row-top">
        <strong>{label}</strong>
        <span
          className={`sla-state ${breached ? "bad" : met ? "good" : "waiting"}`}
        >
          {state}
        </span>
      </div>
      <p>Due: {dateText(due)}</p>
      {actual && <p>Completed: {dateText(actual)}</p>}
    </div>
  );
}

function NotificationsPage() {
  const { refreshUnread } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications", {
        params: { page: 0, size: 50 },
      });
      setItems(data.content || []);
      setError("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const markOne = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      await load();
      refreshUnread?.();
    } catch (e) {
      setError(errorText(e));
    }
  };
  const markAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      await load();
      refreshUnread?.();
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <>
      <PageTitle
        eyebrow="ACTIVITY CENTRE"
        title="Notifications"
        subtitle="Updates about ticket assignments, comments and status changes."
        action={
          <button className="btn btn-secondary" onClick={markAll}>
            <Check size={16} /> Mark all as read
          </button>
        }
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      {loading ? (
        <Loading />
      ) : items.length ? (
        <div className="notification-list">
          {items.map((item) => (
            <div
              className={`notification-item ${item.read ? "" : "unread"}`}
              key={item.id}
            >
              <div className="notification-symbol">
                <Bell size={18} />
              </div>
              <div className="notification-content">
                <div className="notification-top">
                  <strong>{item.title}</strong>
                  <time>{dateText(item.createdAt)}</time>
                </div>
                <p>{item.message}</p>
                <div className="notification-bottom">
                  {item.ticketId && (
                    <Link to={`/tickets/${item.ticketId}`}>
                      Open SD-{item.ticketId} <span>→</span>
                    </Link>
                  )}
                  {!item.read && (
                    <button
                      className="text-button"
                      onClick={() => markOne(item.id)}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
              <span className={`read-indicator ${item.read ? "" : "active"}`} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="You're all caught up"
          subtitle="New ticket updates and messages will appear here."
        />
      )}
    </>
  );
}

function AdminPage() {
  const [agents, setAgents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [agentForm, setAgentForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const load = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([
        api.get("/admin/users/agents"),
        api.get("/admin/categories"),
      ]);
      setAgents(a.data);
      setCategories(c.data);
    } catch (e) {
      setError(errorText(e));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const createAgent = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/admin/users/agents", agentForm);
      setAgentForm({ name: "", email: "", password: "" });
      setSuccess("Agent account created successfully.");
      await load();
    } catch (e2) {
      setError(errorText(e2));
    } finally {
      setBusy(false);
    }
  };
  const createCategory = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/admin/categories", categoryForm);
      setCategoryForm({ name: "", description: "" });
      setSuccess("Category created successfully.");
      await load();
    } catch (e2) {
      setError(errorText(e2));
    } finally {
      setBusy(false);
    }
  };
  const toggleCategory = async (category) => {
    setError("");
    try {
      await api.patch(`/admin/categories/${category.id}/status`, {
        active: !category.active,
      });
      await load();
    } catch (e) {
      setError(errorText(e));
    }
  };
  const setAgent = (k, v) => setAgentForm((p) => ({ ...p, [k]: v }));
  const setCategory = (k, v) => setCategoryForm((p) => ({ ...p, [k]: v }));
  return (
    <>
      <PageTitle
        eyebrow="ADMINISTRATION"
        title="Manage your support team"
        subtitle="Create support agent accounts and organise ticket categories."
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      {success && (
        <div className="success-box">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}
      <div className="admin-grid">
        <section className="panel">
          <div className="panel-head">
            <div className="panel-title-icon">
              <Users size={18} />
              <h2>Create a support agent</h2>
            </div>
          </div>
          <p className="muted panel-intro">
            Agent accounts are created by administrators. Public registration
            cannot grant support privileges.
          </p>
          <form className="stack-form" onSubmit={createAgent}>
            <div className="field">
              <label>Agent name</label>
              <input
                value={agentForm.name}
                onChange={(e) => setAgent("name", e.target.value)}
                placeholder="e.g. Priya Sharma"
                maxLength={100}
                required
              />
            </div>
            <div className="field">
              <label>Work email</label>
              <input
                type="email"
                value={agentForm.email}
                onChange={(e) => setAgent("email", e.target.value)}
                placeholder="agent@company.com"
                required
              />
            </div>
            <div className="field">
              <label>Temporary password</label>
              <input
                type="password"
                value={agentForm.password}
                onChange={(e) => setAgent("password", e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                maxLength={72}
                required
              />
            </div>
            <button className="btn btn-primary" disabled={busy}>
              <Plus size={16} /> Create agent
            </button>
          </form>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div className="panel-title-icon">
              <Wrench size={18} />
              <h2>Add a ticket category</h2>
            </div>
          </div>
          <p className="muted panel-intro">
            Categories help employees route requests to the right support area.
          </p>
          <form className="stack-form" onSubmit={createCategory}>
            <div className="field">
              <label>Category name</label>
              <input
                value={categoryForm.name}
                onChange={(e) => setCategory("name", e.target.value)}
                placeholder="e.g. Hardware"
                maxLength={100}
                required
              />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                rows={3}
                value={categoryForm.description}
                onChange={(e) => setCategory("description", e.target.value)}
                placeholder="What type of requests belong here?"
                maxLength={500}
              />
            </div>
            <button className="btn btn-primary" disabled={busy}>
              <Plus size={16} /> Create category
            </button>
          </form>
        </section>
      </div>
      <div className="admin-lists">
        <section className="panel">
          <div className="panel-head">
            <div className="panel-title-icon">
              <Users size={18} />
              <h2>Active agents</h2>
            </div>
            <span className="count-chip">{agents.length}</span>
          </div>
          {agents.length ? (
            <div className="simple-list">
              {agents.map((a) => (
                <div className="simple-list-item" key={a.id}>
                  <div className="avatar">{initials(a.name)}</div>
                  <div>
                    <strong>{a.name}</strong>
                    <span>{a.email}</span>
                  </div>
                  <span className="role-badge">AGENT</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted small-text">No active agents yet.</p>
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <div className="panel-title-icon">
              <Wrench size={18} />
              <h2>Ticket categories</h2>
            </div>
            <span className="count-chip">{categories.length}</span>
          </div>
          {categories.length ? (
            <div className="simple-list">
              {categories.map((c) => (
                <div className="simple-list-item" key={c.id}>
                  <div className="category-icon">
                    <Wrench size={17} />
                  </div>
                  <div>
                    <strong>{c.name}</strong>
                    <span>{c.description || "No description"}</span>
                  </div>
                  <button
                    className={`mini-toggle ${c.active ? "enabled" : ""}`}
                    onClick={() => toggleCategory(c)}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted small-text">
              No categories have been created yet.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route
            path="tickets/new"
            element={
              <EmployeeOnly>
                <NewTicketPage />
              </EmployeeOnly>
            }
          />
          <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route
            path="admin"
            element={
              <AdminOnly>
                <AdminPage />
              </AdminOnly>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function EmployeeOnly({ children }) {
  const { user } = useAuth();
  return user?.role === "EMPLOYEE" ? children : <Navigate to="/" replace />;
}
function AdminOnly({ children }) {
  const { user } = useAuth();
  return user?.role === "ADMIN" ? children : <Navigate to="/" replace />;
}
