
import { useEffect, useMemo, useState } from "react";
import "./App.css";

import { auth, db } from "./firebase";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const ADMIN_EMAIL = "avdeshm651@gmail.com";

const categories = [
  "All Developers",
  "Frontend",
  "Backend",
  "Full Stack",
  "AI / ML",
  "Mobile",
  "UI / UX",
  "Other",
];

const emptyProfile = {
  name: "",
  username: "",
  role: "Full Stack Developer",
  photoURL: "",
  bio: "",
  skills: "",
  github: "",
  linkedin: "",
  portfolio: "",
};

const demoDevelopers = [
  {
    id: "demo-aarav",
    name: "Aarav Sharma",
    username: "aaravdev",
    role: "Frontend Developer",
    skills: ["HTML", "CSS", "JavaScript", "React"],
    bio: "Creating responsive websites and interactive user interfaces.",
    github: "",
    linkedin: "",
    portfolio: "",
    photoURL: "",
  },
  {
    id: "demo-priya",
    name: "Priya Verma",
    username: "priyacodes",
    role: "Backend Developer",
    skills: ["Node.js", "Express", "MongoDB", "REST API"],
    bio: "Building APIs and reliable server-side applications.",
    github: "",
    linkedin: "",
    portfolio: "",
    photoURL: "",
  },
  {
    id: "demo-rahul",
    name: "Rahul Meena",
    username: "rahulstack",
    role: "Full Stack Developer",
    skills: ["React", "Node.js", "Firebase", "JavaScript"],
    bio: "Developing full stack applications from frontend to backend.",
    github: "",
    linkedin: "",
    portfolio: "",
    photoURL: "",
  },
  {
    id: "demo-neha",
    name: "Neha Gupta",
    username: "nehai",
    role: "AI / ML Engineer",
    skills: ["Python", "Machine Learning", "Pandas", "NumPy"],
    bio: "Exploring artificial intelligence and machine learning.",
    github: "",
    linkedin: "",
    portfolio: "",
    photoURL: "",
  },
  {
    id: "demo-arjun",
    name: "Arjun Singh",
    username: "arjunmobile",
    role: "Mobile Developer",
    skills: ["Flutter", "Dart", "Firebase", "Git"],
    bio: "Building mobile applications for everyday needs.",
    github: "",
    linkedin: "",
    portfolio: "",
    photoURL: "",
  },
  {
    id: "demo-ananya",
    name: "Ananya Jain",
    username: "ananyaux",
    role: "UI/UX Designer",
    skills: ["Figma", "UI Design", "Wireframing", "Prototyping"],
    bio: "Designing intuitive interfaces and user-friendly experiences.",
    github: "",
    linkedin: "",
    portfolio: "",
    photoURL: "",
  },
  {
    id: "demo-karan",
    name: "Karan Yadav",
    username: "karanfullstack",
    role: "Full Stack Developer",
    skills: ["React", "Java", "SQL", "JavaScript"],
    bio: "Building modern web applications and database-driven systems.",
    github: "",
    linkedin: "",
    portfolio: "",
    photoURL: "",
  },
];


function initials(name = "Developer") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "D"
  );
}

function safeUrl(value) {
  if (!value || typeof value !== "string") return "";

  const trimmed = value.trim();

  if (!trimmed) return "";

  const url = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    return parsed.href;
  } catch {
    return "";
  }
}

function App() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState("All Developers");

  const [sortBy, setSortBy] = useState("latest");

  const [user, setUser] = useState(null);

  const [showAuth, setShowAuth] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [dbError, setDbError] = useState("");

  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [selectedProfile, setSelectedProfile] = useState(null);

  const [showAdmin, setShowAdmin] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");

  const isAdmin =
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Firebase authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  // Load developer profiles from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "developers"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setProfiles(rows);
        setDbError("");
        setProfilesLoading(false);
      },
      (error) => {
        console.error("Developer profiles could not be loaded:", error);

        setDbError(
          "Profiles load nahi ho paaye. Firebase Firestore Rules check karein."
        );

        setProfilesLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // Search and category filters
 // Show demo developers and Firebase developers together
const visibleProfiles = useMemo(() => {
  const allProfiles = [
    ...demoDevelopers,
    ...profiles.filter(
      (profile) =>
        !demoDevelopers.some(
          (demo) => demo.id === profile.id
        )
    ),
  ];

  return allProfiles.filter((developer) => {
    const skills = Array.isArray(developer.skills)
      ? developer.skills
      : [];

    const searchable = [
      developer.name,
      developer.username,
      developer.role,
      developer.bio,
      ...skills,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchable.includes(
      search.trim().toLowerCase()
    );

    const role = (developer.role || "").toLowerCase();
    const category = activeCategory.toLowerCase();

    let matchesCategory = activeCategory === "All Developers";

    if (category === "frontend") {
      matchesCategory =
        role.includes("front-end") ||
        role.includes("frontend");
    } else if (category === "backend") {
      matchesCategory =
        role.includes("back-end") ||
        role.includes("backend");
    } else if (category === "full stack") {
      matchesCategory =
        role.includes("full stack") ||
        role.includes("full-stack");
    } else if (category === "ai / ml") {
      matchesCategory =
        role.includes("ai") ||
        role.includes("machine learning") ||
        role.includes("ml engineer");
    } else if (category === "mobile") {
      matchesCategory =
        role.includes("mobile") ||
        role.includes("android") ||
        role.includes("ios");
    } else if (category === "ui / ux") {
      matchesCategory =
        role.includes("ui") ||
        role.includes("ux") ||
        role.includes("designer");
    } else if (category === "other") {
      matchesCategory = ![
        "frontend",
        "front-end",
        "backend",
        "back-end",
        "full stack",
        "full-stack",
        "ai",
        "machine learning",
        "mobile",
        "android",
        "ios",
        "ui",
        "ux",
        "designer",
      ].some((term) => role.includes(term));
    }

    return matchesSearch && matchesCategory;
  });
}, [profiles, search, activeCategory]);

  // Sort filtered profiles
  const sortedProfiles = useMemo(() => {
    const result = [...visibleProfiles];

    if (sortBy === "name-asc") {
      result.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
    } else if (sortBy === "name-desc") {
      result.sort((a, b) =>
        (b.name || "").localeCompare(a.name || "")
      );
    } else if (sortBy === "latest") {
      result.sort((a, b) => {
        const dateA = a.updatedAt?.toMillis?.() || 0;
        const dateB = b.updatedAt?.toMillis?.() || 0;

        return dateB - dateA;
      });
    }

    return result;
  }, [visibleProfiles, sortBy]);

  const myProfile = profiles.find(
    (profile) =>
      profile.id === user?.uid || profile.ownerUid === user?.uid
  );

  // Login and signup
  async function handleAuth(event) {
    event.preventDefault();

    setAuthError("");
    setAuthLoading(true);

    try {
      if (isSignup) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          authEmail.trim(),
          authPassword
        );

        await updateProfile(credential.user, {
          displayName: authName.trim(),
        });
      } else {
        await signInWithEmailAndPassword(
          auth,
          authEmail.trim(),
          authPassword
        );
      }

      setShowAuth(false);
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
    } catch (error) {
      const messages = {
        "auth/email-already-in-use":
          "This email is already registered.",
        "auth/invalid-email":
          "Please enter a valid email address.",
        "auth/weak-password":
          "Password must be at least 6 characters.",
        "auth/invalid-credential":
          "Email or password is incorrect.",
        "auth/too-many-requests":
          "Too many attempts. Please try again later.",
        "auth/network-request-failed":
          "Network error. Check your internet.",
      };

      setAuthError(messages[error.code] || error.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    setShowAdmin(false);
    setSelectedProfile(null);
  }

  // Open profile editor
  function openProfileForm() {
    if (!user) {
      setAuthError("");
      setShowAuth(true);
      return;
    }

    const profile = myProfile;

    setProfileForm(
      profile
        ? {
            ...emptyProfile,
            ...profile,
            skills: Array.isArray(profile.skills)
              ? profile.skills.join(", ")
              : "",
          }
        : {
            ...emptyProfile,
            name: user.displayName || "",
            username: user.email?.split("@")[0] || "",
          }
    );

    setProfileError("");
    setShowProfileForm(true);
  }

  // Save developer profile
  async function saveProfile(event) {
    event.preventDefault();

    if (!user) {
      setProfileError("Please login first.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");

    const skills = profileForm.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, 20);

    const payload = {
      name: profileForm.name.trim(),
      username: profileForm.username.trim().replace(/^@/, ""),
      role: profileForm.role,
      photoURL: safeUrl(profileForm.photoURL),
      bio: profileForm.bio.trim(),
      skills,
      github: safeUrl(profileForm.github),
      linkedin: safeUrl(profileForm.linkedin),
      portfolio: safeUrl(profileForm.portfolio),
      ownerUid: user.uid,
      ownerEmail: user.email || "",
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, "developers", user.uid), payload, {
        merge: true,
      });

      setShowProfileForm(false);
      setAdminMessage("Profile saved successfully!");

      window.setTimeout(() => setAdminMessage(""), 3500);
    } catch (error) {
      console.error(error);

      setProfileError(
        error.code === "permission-denied"
          ? "Permission denied. Firebase Console mein Firestore Rules check karein."
          : error.message || "Profile save nahi hua."
      );
    } finally {
      setProfileSaving(false);
    }
  }

  // Admin-only profile deletion
  async function deleteProfile(profile) {
    if (!isAdmin) return;

    if (
      !window.confirm(
        `Delete ${profile.name || "this profile"}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "developers", profile.id));

      setAdminMessage("Profile deleted.");

      if (selectedProfile?.id === profile.id) {
        setSelectedProfile(null);
      }
    } catch (error) {
      setAdminMessage(`Delete failed: ${error.message}`);
    }
  }

  return (
    <div className="app">
      {/* Login / Signup Modal */}
      {showAuth && (
        <div
          className="auth-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowAuth(false);
            }
          }}
        >
          <section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
          >
            <button
              className="auth-close"
              onClick={() => setShowAuth(false)}
              aria-label="Close login form"
            >
              ×
            </button>

            <span className="section-label">WELCOME TO DEVDIRECTORY</span>

            <h2 id="auth-title">
              {isSignup ? "Create Account" : "Welcome Back"}
            </h2>

            <p>
              {isSignup
                ? "Join the developer community."
                : "Sign in to your developer account."}
            </p>

            <form onSubmit={handleAuth}>
              {isSignup && (
                <input
                  type="text"
                  placeholder="Your full name"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required
                  minLength={2}
                  autoComplete="name"
                />
              )}

              <input
                type="email"
                placeholder="Email address"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <input
                type="password"
                placeholder="Password (at least 6 characters)"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />

              {authError && (
                <p className="auth-error" role="alert">
                  {authError}
                </p>
              )}

              <button
                className="primary-button auth-submit"
                type="submit"
                disabled={authLoading}
              >
                {authLoading
                  ? "Please wait..."
                  : isSignup
                    ? "Create Account"
                    : "Login"}
              </button>
            </form>

            <p className="auth-switch">
              {isSignup
                ? "Already have an account?"
                : "New to DevDirectory?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setAuthError("");
                }}
              >
                {isSignup ? "Login" : "Create account"}
              </button>
            </p>
          </section>
        </div>
      )}

      {/* Create / Edit Profile Modal */}
      {showProfileForm && (
        <div
          className="feature-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowProfileForm(false);
            }
          }}
        >
          <section
            className="feature-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-form-title"
          >
            <button
              className="auth-close"
              onClick={() => setShowProfileForm(false)}
              aria-label="Close profile form"
            >
              ×
            </button>

            <span className="section-label">YOUR DEVELOPER IDENTITY</span>

            <h2 id="profile-form-title">
              {myProfile ? "Edit Your Profile" : "Create Your Profile"}
            </h2>

            <p>
              Your profile will be saved to Firebase and shown in the directory.
            </p>

            <form className="profile-form" onSubmit={saveProfile}>
              <label>
                Full name
                <input
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  required
                  maxLength={80}
                  placeholder="Avdesh Meena"
                />
              </label>

              <label>
                Username
                <input
                  value={profileForm.username}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, username: e.target.value })
                  }
                  required
                  maxLength={30}
                  placeholder="avdeshmeena"
                />
              </label>

              <label>
                Developer role
                <select
                  value={profileForm.role}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, role: e.target.value })
                  }
                >
                  {[
                    "Frontend Developer",
                    "Backend Developer",
                    "Full Stack Developer",
                    "AI / ML Engineer",
                    "Mobile Developer",
                    "UI/UX Designer",
                    "DevOps Engineer",
                    "Student Developer",
                    "Other",
                  ].map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Profile photo URL (optional)
                <input
                  type="url"
                  value={profileForm.photoURL}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, photoURL: e.target.value })
                  }
                  placeholder="https://example.com/photo.jpg"
                />
              </label>

              <label className="full-field">
                About you
                <textarea
                  value={profileForm.bio}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, bio: e.target.value })
                  }
                  required
                  minLength={10}
                  maxLength={500}
                  placeholder="Tell people what you build and what you are interested in..."
                  rows={4}
                />
              </label>

              <label className="full-field">
                Skills (comma separated)
                <input
                  value={profileForm.skills}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, skills: e.target.value })
                  }
                  required
                  placeholder="React, JavaScript, Firebase"
                />
              </label>

              <label>
                GitHub URL
                <input
                  type="url"
                  value={profileForm.github}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, github: e.target.value })
                  }
                  placeholder="https://github.com/username"
                />
              </label>

              <label>
                LinkedIn URL
                <input
                  type="url"
                  value={profileForm.linkedin}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, linkedin: e.target.value })
                  }
                  placeholder="https://linkedin.com/in/username"
                />
              </label>

              <label className="full-field">
                Portfolio / website URL
                <input
                  type="url"
                  value={profileForm.portfolio}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      portfolio: e.target.value,
                    })
                  }
                  placeholder="https://yourwebsite.com"
                />
              </label>

              {profileError && (
                <p className="auth-error full-field" role="alert">
                  {profileError}
                </p>
              )}

              <div className="form-actions full-field">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowProfileForm(false)}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={profileSaving}
                >
                  {profileSaving ? "Saving..." : "Save Profile →"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Developer Details Modal */}
      {selectedProfile && (
        <div
          className="feature-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedProfile(null);
            }
          }}
        >
          <section
            className="feature-modal detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-name"
          >
            <button
              className="auth-close"
              onClick={() => setSelectedProfile(null)}
              aria-label="Close profile"
            >
              ×
            </button>

            <div className="detail-top">
              {selectedProfile.photoURL ? (
                <img
                  className="detail-avatar"
                  src={safeUrl(selectedProfile.photoURL)}
                  alt={`${selectedProfile.name} profile`}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="detail-avatar detail-initials">
                  {initials(selectedProfile.name)}
                </div>
              )}

              <div>
                <span className="section-label">DEVELOPER PROFILE</span>
                <h2 id="detail-name">{selectedProfile.name}</h2>
                <p className="developer-role">{selectedProfile.role}</p>
                <span className="username">
                  @{(selectedProfile.username || "developer").replace(/^@/, "")}
                </span>
              </div>
            </div>

            <h3 className="detail-subtitle">About</h3>

            <p className="detail-bio">
              {selectedProfile.bio ||
                "This developer has not added a bio yet."}
            </p>

            <h3 className="detail-subtitle">Skills & technologies</h3>

            <div className="skill-list detail-skills">
              {(Array.isArray(selectedProfile.skills)
                ? selectedProfile.skills
                : []
              ).map((skill) => (
                <span className="skill-tag" key={skill}>
                  {skill}
                </span>
              ))}
            </div>

            <div className="detail-links">
              {[
                ["GitHub", selectedProfile.github],
                ["LinkedIn", selectedProfile.linkedin],
                ["Portfolio", selectedProfile.portfolio],
              ]
                .filter((item) => safeUrl(item[1]))
                .map(([label, url]) => (
                  <a
                    key={label}
                    className="secondary-button"
                    href={safeUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {label} ↗
                  </a>
                ))}
            </div>

            {isAdmin && (
              <button
                className="danger-button"
                onClick={() => deleteProfile(selectedProfile)}
              >
                Delete profile
              </button>
            )}
          </section>
        </div>
      )}

      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      {/* Navigation */}
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">&lt;/&gt;</span>
          Dev<span>Directory</span>
          <span className="brand-dot">.</span>
        </a>

        <nav className="nav-links">
          <a className="nav-active" href="#home">
            Home
          </a>
          <a href="#developers">Explore Developers</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="logged-user">
                {user.displayName || user.email}
              </span>

              <button className="join-button" onClick={openProfileForm}>
                {myProfile ? "Edit Profile" : "Add Profile"}
              </button>

              {isAdmin && (
                <button
                  className="join-button admin-nav-button"
                  onClick={() => setShowAdmin(!showAdmin)}
                >
                  {showAdmin ? "Hide Admin" : "Admin Dashboard"}
                </button>
              )}

              <button className="join-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <button
              className="join-button"
              onClick={() => {
                setAuthError("");
                setShowAuth(true);
              }}
            >
              Login / Sign Up <span>↗</span>
            </button>
          )}
        </div>
      </header>

      <main id="home">
        {/* Hero */}
        <section className="hero">
          <div className="announcement">
            <span className="live-dot" />
            YOUR NEXT COLLABORATOR IS HERE
            <span className="announcement-arrow">↗</span>
          </div>

          <h1>
            Discover Developers.
            <br />
            <span className="gradient-text">
              Build Something Extraordinary.
            </span>
          </h1>

          <p className="hero-description">
            A home for creators, coders, and innovators. Discover talented
            developers, explore their skills, and find your next great
            collaborator.
          </p>

          <div className="hero-actions">
            <a className="primary-button" href="#developers">
              Explore Directory <span>→</span>
            </a>

            <button className="secondary-button" onClick={openProfileForm}>
              Add Your Profile +
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <strong>
                {String(profiles.length || demoDevelopers.length).padStart(
                  2,
                  "0"
                )}
              </strong>
              <span>Developer Profiles</span>
            </div>

            <div>
            <strong>
  {
    new Set(
      [...demoDevelopers, ...profiles].flatMap((profile) =>
        Array.isArray(profile.skills) ? profile.skills : []
      )
    ).size
  }+
</strong>
<span>Skills Listed</span>
            </div>

            <div>
              <strong>∞</strong>
              <span>Ideas to Build</span>
            </div>
          </div>
        </section>

        {/* Admin Dashboard */}
        {showAdmin && isAdmin && (
          <section className="admin-section" id="admin-dashboard">
            <div className="section-heading">
              <div>
                <span className="section-label">ADMIN ONLY</span>
                <h2>
                  Admin <span className="gradient-text">Dashboard.</span>
                </h2>
                <p>Review and moderate submitted developer profiles.</p>
              </div>

              <span className="results-count">
                {profiles.length} PROFILES
              </span>
            </div>

            {adminMessage && (
              <p className="status-message">{adminMessage}</p>
            )}

            {profiles.length === 0 ? (
              <p className="empty-admin">No submitted profiles yet.</p>
            ) : (
              <div className="admin-list">
                {profiles.map((profile) => (
                  <div className="admin-row" key={profile.id}>
                    <div className="admin-person">
                      <div className="admin-avatar">
                        {initials(profile.name)}
                      </div>

                      <div>
                        <strong>{profile.name || "Unnamed developer"}</strong>
                        <span>
                          {profile.ownerEmail || "No email"} ·{" "}
                          {profile.role || "No role"}
                        </span>
                      </div>
                    </div>

                    <div className="admin-row-actions">
                      <button
                        className="secondary-button"
                        onClick={() => setSelectedProfile(profile)}
                      >
                        View
                      </button>

                      <button
                        className="danger-button"
                        onClick={() => deleteProfile(profile)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Developer Directory */}
        <section className="directory-section" id="developers">
          <div className="section-heading">
            <div>
              <span className="section-label">THE COMMUNITY</span>
              <h2>
                Meet the <span className="gradient-text">Developers.</span>
              </h2>
              <p>Explore people who turn ideas into reality.</p>
            </div>

            <span className="results-count">
              {visibleProfiles.length} PROFILES
            </span>
          </div>

          {dbError && (
            <p className="status-message error-status">{dbError}</p>
          )}

          {adminMessage && !showAdmin && (
            <p className="status-message">{adminMessage}</p>
          )}

          <div className="search-box">
            <span className="search-icon">⌕</span>

            <input
              type="text"
              placeholder="Search developers, skills, technologies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search developers"
            />

            <span className="search-shortcut">SEARCH</span>
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-button ${
                  activeCategory === category ? "category-active" : ""
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Sorting */}
          <div className="directory-toolbar">
            <label className="sort-label" htmlFor="developer-sort">
              Sort developers:
            </label>

            <select
              id="developer-sort"
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort developers"
            >
              <option value="latest">Latest Updated</option>
              <option value="name-asc">Name: A–Z</option>
              <option value="name-desc">Name: Z–A</option>
            </select>
          </div>

          {profilesLoading && (
            <p className="loading-message">
              Loading developer directory...
            </p>
          )}

          <div className="developer-grid">
            {sortedProfiles.map((developer, index) => (
              <article
                className="developer-card"
                key={developer.id}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="card-top">
                  {developer.photoURL ? (
                    <img
                      className="avatar profile-card-image"
                      src={safeUrl(developer.photoURL)}
                      alt={`${developer.name} avatar`}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="avatar"
                      style={{
                        "--avatar-color": `hsl(${
                          (index * 43 + 355) % 360
                        } 85% 60%)`,
                      }}
                    >
                      {initials(developer.name)}
                    </div>
                  )}

                  <span className="available">
                    <span />
                    {developer.ownerUid ? "COMMUNITY" : "FEATURED"}
                  </span>
                </div>

                <span className="username">
                  @
                  {(developer.username || developer.name || "developer")
                    .replace(/^@/, "")}
                </span>

                <h3>{developer.name}</h3>

                <p className="developer-role">{developer.role}</p>

                <p className="card-bio">
                  {developer.bio ||
                    "Developer profile — open to explore skills and links."}
                </p>

                <div className="skill-list">
                  {(Array.isArray(developer.skills)
                    ? developer.skills
                    : []
                  )
                    .slice(0, 4)
                    .map((skill) => (
                      <span className="skill-tag" key={skill}>
                        {skill}
                      </span>
                    ))}
                </div>

                {/* GitHub, LinkedIn and Portfolio */}
                <div className="card-social-links">
                  {developer.github && safeUrl(developer.github) && (
                    <a
                      className="social-link"
                      href={safeUrl(developer.github)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`GitHub profile of ${developer.name}`}
                    >
                      GitHub ↗
                    </a>
                  )}

                  {developer.linkedin && safeUrl(developer.linkedin) && (
                    <a
                      className="social-link"
                      href={safeUrl(developer.linkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`LinkedIn profile of ${developer.name}`}
                    >
                      LinkedIn ↗
                    </a>
                  )}

                  {developer.portfolio && safeUrl(developer.portfolio) && (
                    <a
                      className="social-link"
                      href={safeUrl(developer.portfolio)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Portfolio ↗
                    </a>
                  )}
                </div>

                <button
                  className="profile-button"
                  onClick={() => setSelectedProfile(developer)}
                >
                  View Profile <span>↗</span>
                </button>
              </article>
            ))}
          </div>

          {!profilesLoading && visibleProfiles.length === 0 && (
            <div className="empty-state">
              <span>⌕</span>
              <h3>No developers found</h3>
              <p>Try another name, skill, or category.</p>

              <button
                className="secondary-button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All Developers");
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

          {!profiles.length && (
            <p className="demo-note">
              Showing sample profiles while the community grows. Create an
              account and add your profile to publish a real one.
            </p>
          )}
        </section>

        {/* Call to action */}
        <section className="cta-section" id="about">
          <span className="section-label">YOUR JOURNEY STARTS HERE</span>

          <h2>
            Your skills deserve
            <br />
            <span className="gradient-text">to be discovered.</span>
          </h2>

          <p>
            Build your developer identity, share your skills, and connect
            with people who love building things.
          </p>

          <button className="primary-button" onClick={openProfileForm}>
            Create Your Profile ↑
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">&lt;/&gt;</span>
          Dev<span>Directory</span>
          <span className="brand-dot">.</span>
        </a>

        <p>Built for developers, by developers.</p>

        <span>© {new Date().getFullYear()} DevDirectory</span>
      </footer>
    </div>
  );
}

export default App;

