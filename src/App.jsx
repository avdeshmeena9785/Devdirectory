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
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
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
    id: "demo-alex",
    name: "Alex Morgan",
    role: "Full Stack Developer",
    skills: ["React", "Node.js", "MongoDB"],
    username: "alexmorgan",
    bio: "Building useful web experiences from front end to back end.",
  },
  {
    id: "demo-sarah",
    name: "Sarah Chen",
    role: "Frontend Developer",
    skills: ["JavaScript", "React", "CSS"],
    username: "sarahchen",
    bio: "Creating accessible and polished user interfaces.",
  },
  {
    id: "demo-david",
    name: "David Kumar",
    role: "Backend Developer",
    skills: ["Python", "Django", "PostgreSQL"],
    username: "davidkumar",
    bio: "Designing reliable APIs and data-driven applications.",
  },
  {
    id: "demo-emma",
    name: "Emma Wilson",
    role: "AI / ML Engineer",
    skills: ["Python", "AI", "Machine Learning"],
    username: "emmawilson",
    bio: "Exploring practical applications of machine learning.",
  },
  {
    id: "demo-ryan",
    name: "Ryan Patel",
    role: "Mobile Developer",
    skills: ["React Native", "Java", "Firebase"],
    username: "ryanpatel",
    bio: "Making helpful mobile experiences.",
  },
  {
    id: "demo-olivia",
    name: "Olivia Garcia",
    role: "UI / UX Designer",
    skills: ["Figma", "UI Design", "Prototyping"],
    username: "oliviagarcia",
    bio: "Turning complex ideas into clear, thoughtful designs.",
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
  if (!value) return "";

  const trimmed = value.trim();

  if (!trimmed) return "";

  return /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
}

function App() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState("All Developers");

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

  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardTab, setDashboardTab] = useState("overview");

  const [projects, setProjects] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const [itemKind, setItemKind] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [itemSaving, setItemSaving] = useState(false);
  const [itemError, setItemError] = useState("");

  const [itemForm, setItemForm] = useState({
    title: "",
    description: "",
    technologies: "",
    imageURL: "",
    githubURL: "",
    liveURL: "",
    date: "",
    certificateURL: "",
  });

  const isAdmin =
    user?.email?.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  // Public developer directory
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
        console.error(error);
        setDbError(
          "Profiles load nahi ho paaye. Firebase Firestore Rules check karein."
        );
        setProfilesLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // Public projects
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "projects"),
      (snapshot) => {
        setProjects(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
      },
      (error) => {
        console.error("Projects load error:", error);
      }
    );

    return unsubscribe;
  }, []);

  // Public achievements
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "achievements"),
      (snapshot) => {
        setAchievements(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
      },
      (error) => {
        console.error("Achievements load error:", error);
      }
    );

    return unsubscribe;
  }, []);

  const visibleProfiles = useMemo(() => {
    const base = profiles.length ? profiles : demoDevelopers;

    return base.filter((developer) => {
      const searchable = [
        developer.name,
        developer.username,
        developer.role,
        developer.bio,
        ...(developer.skills || []),
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
      }

      if (category === "backend") {
        matchesCategory =
          role.includes("back-end") ||
          role.includes("backend");
      }

      if (category === "full stack") {
        matchesCategory =
          role.includes("full stack") ||
          role.includes("full-stack");
      }

      if (category === "ai / ml") {
        matchesCategory =
          role.includes("ai") ||
          role.includes("machine learning") ||
          role.includes("ml engineer");
      }

      if (category === "mobile") {
        matchesCategory =
          role.includes("mobile") ||
          role.includes("android") ||
          role.includes("ios");
      }

      if (category === "ui / ux") {
        matchesCategory =
          role.includes("ui") ||
          role.includes("ux") ||
          role.includes("designer");
      }

      if (category === "other") {
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

  const myProfile = profiles.find(
    (profile) =>
      profile.id === user?.uid ||
      profile.ownerUid === user?.uid
  );

  const myProjects = projects.filter(
    (project) => project.ownerUid === user?.uid
  );

  const myAchievements = achievements.filter(
    (achievement) => achievement.ownerUid === user?.uid
  );

  function showMessage(message) {
    setAdminMessage(message);

    window.setTimeout(() => {
      setAdminMessage("");
    }, 3500);
  }

  async function handleAuth(event) {
    event.preventDefault();

    setAuthError("");
    setAuthLoading(true);

    try {
      if (isSignup) {
        const credential =
          await createUserWithEmailAndPassword(
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

      setAuthError(
        messages[error.code] ||
          error.message ||
          "Authentication failed."
      );
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);

    setShowAdmin(false);
    setShowDashboard(false);
    setSelectedProfile(null);
  }

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
      username: profileForm.username
        .trim()
        .replace(/^@/, ""),
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
      await setDoc(
        doc(db, "developers", user.uid),
        payload,
        { merge: true }
      );

      setShowProfileForm(false);
      showMessage("Profile saved successfully!");
    } catch (error) {
      console.error(error);

      setProfileError(
        error.code === "permission-denied"
          ? "Permission denied. Firebase Rules check karein."
          : error.message || "Profile save nahi hua."
      );
    } finally {
      setProfileSaving(false);
    }
  }

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
      showMessage("Profile deleted.");
    } catch (error) {
      showMessage(`Delete failed: ${error.message}`);
    }
  }

  // Open Add/Edit form for a project or achievement
  function openItemForm(kind, item = null) {
    if (!user) {
      setShowAuth(true);
      setAuthError("");
      return;
    }

    setItemKind(kind);
    setEditingItem(item);
    setItemError("");

    setItemForm({
      title: item?.title || "",
      description: item?.description || "",
      technologies: Array.isArray(item?.technologies)
        ? item.technologies.join(", ")
        : "",
      imageURL: item?.imageURL || "",
      githubURL: item?.githubURL || "",
      liveURL: item?.liveURL || "",
      date: item?.date || "",
      certificateURL: item?.certificateURL || "",
    });
  }

  async function saveDashboardItem(event) {
    event.preventDefault();

    if (!user) {
      setItemError("Login karna zaroori hai.");
      return;
    }

    setItemSaving(true);
    setItemError("");

    const collectionName =
      itemKind === "project" ? "projects" : "achievements";

    const payload = {
      title: itemForm.title.trim(),
      description: itemForm.description.trim(),
      ownerUid: user.uid,
      ownerName: myProfile?.name || user.displayName || "Developer",
      ownerEmail: user.email || "",
      updatedAt: serverTimestamp(),
    };

    if (itemKind === "project") {
      payload.technologies = itemForm.technologies
        .split(",")
        .map((technology) => technology.trim())
        .filter(Boolean)
        .slice(0, 20);

      payload.imageURL = safeUrl(itemForm.imageURL);
      payload.githubURL = safeUrl(itemForm.githubURL);
      payload.liveURL = safeUrl(itemForm.liveURL);
    } else {
      payload.date = itemForm.date;
      payload.certificateURL = safeUrl(itemForm.certificateURL);
    }

    try {
      if (editingItem) {
        // UI ownership check; Firestore Rules must enforce this too.
        if (editingItem.ownerUid !== user.uid) {
          throw new Error(
            "Tum sirf apna content edit kar sakte ho."
          );
        }

        await updateDoc(
          doc(db, collectionName, editingItem.id),
          payload
        );

        showMessage("Updated successfully!");
      } else {
        payload.createdAt = serverTimestamp();

        await addDoc(
          collection(db, collectionName),
          payload
        );

        showMessage("Added successfully!");
      }

      setItemKind("");
      setEditingItem(null);
    } catch (error) {
      console.error(error);

      setItemError(
        error.code === "permission-denied"
          ? "Permission denied. Firebase Rules publish karein."
          : error.message || "Save nahi ho paya."
      );
    } finally {
      setItemSaving(false);
    }
  }

  async function deleteDashboardItem(kind, item) {
    if (!user || item.ownerUid !== user.uid) {
      showMessage(
        "Tum sirf apne projects aur achievements delete kar sakte ho."
      );
      return;
    }

    const label =
      kind === "project" ? "project" : "achievement";

    if (
      !window.confirm(
        `Kya tum ye ${label} delete karna chahte ho?`
      )
    ) {
      return;
    }

    const collectionName =
      kind === "project" ? "projects" : "achievements";

    try {
      await deleteDoc(
        doc(db, collectionName, item.id)
      );

      showMessage(`${label} deleted successfully.`);
    } catch (error) {
      showMessage(
        error.code === "permission-denied"
          ? "Delete permission nahi hai. Firebase Rules check karo."
          : error.message
      );
    }
  }

  function openDeveloperProfile(profile) {
    setSelectedProfile(profile);
  }

  const selectedProjects = selectedProfile
    ? projects.filter(
        (project) =>
          project.ownerUid ===
          (selectedProfile.ownerUid || selectedProfile.id)
      )
    : [];

  const selectedAchievements = selectedProfile
    ? achievements.filter(
        (achievement) =>
          achievement.ownerUid ===
          (selectedProfile.ownerUid || selectedProfile.id)
      )
    : [];

  return (
    <div className="app">
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      {/* LOGIN / SIGN UP */}
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
          >
            <button
              className="auth-close"
              onClick={() => setShowAuth(false)}
              aria-label="Close login form"
            >
              ×
            </button>

            <span className="section-label">
              WELCOME TO DEVDIRECTORY
            </span>

            <h2>
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
                  onChange={(event) =>
                    setAuthName(event.target.value)
                  }
                  required
                  minLength={2}
                  autoComplete="name"
                />
              )}

              <input
                type="email"
                placeholder="Email address"
                value={authEmail}
                onChange={(event) =>
                  setAuthEmail(event.target.value)
                }
                required
                autoComplete="email"
              />

              <input
                type="password"
                placeholder="Password (at least 6 characters)"
                value={authPassword}
                onChange={(event) =>
                  setAuthPassword(event.target.value)
                }
                required
                minLength={6}
                autoComplete={
                  isSignup ? "new-password" : "current-password"
                }
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
                : "New to DevDirectory?"}

              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setAuthError("");
                }}
              >
                {isSignup ? " Login" : " Create account"}
              </button>
            </p>
          </section>
        </div>
      )}

      {/* PROFILE FORM */}
      {showProfileForm && (
        <div
          className="feature-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowProfileForm(false);
            }
          }}
        >
          <section className="feature-modal">
            <button
              className="auth-close"
              onClick={() => setShowProfileForm(false)}
            >
              ×
            </button>

            <span className="section-label">
              YOUR DEVELOPER IDENTITY
            </span>

            <h2>
              {myProfile ? "Edit Your Profile" : "Create Your Profile"}
            </h2>

            <p>Your profile will be saved to Firebase.</p>

            <form
              className="profile-form"
              onSubmit={saveProfile}
            >
              <label>
                Full name
                <input
                  value={profileForm.name}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      name: event.target.value,
                    })
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
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      username: event.target.value,
                    })
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
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      role: event.target.value,
                    })
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
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </label>

              <label>
                Profile photo URL
                <input
                  type="url"
                  value={profileForm.photoURL}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      photoURL: event.target.value,
                    })
                  }
                  placeholder="https://..."
                />
              </label>

              <label className="full-field">
                About you
                <textarea
                  value={profileForm.bio}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      bio: event.target.value,
                    })
                  }
                  required
                  minLength={10}
                  maxLength={500}
                  rows={4}
                  placeholder="Tell people what you build..."
                />
              </label>

              <label className="full-field">
                Skills (comma separated)
                <input
                  value={profileForm.skills}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      skills: event.target.value,
                    })
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
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      github: event.target.value,
                    })
                  }
                  placeholder="https://github.com/username"
                />
              </label>

              <label>
                LinkedIn URL
                <input
                  type="url"
                  value={profileForm.linkedin}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      linkedin: event.target.value,
                    })
                  }
                  placeholder="https://linkedin.com/in/username"
                />
              </label>

              <label className="full-field">
                Portfolio URL
                <input
                  type="url"
                  value={profileForm.portfolio}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      portfolio: event.target.value,
                    })
                  }
                  placeholder="https://yourwebsite.com"
                />
              </label>

              {profileError && (
                <p className="auth-error full-field">
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

      {/* PROJECT / ACHIEVEMENT FORM */}
      {itemKind && (
        <div
          className="feature-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setItemKind("");
              setEditingItem(null);
            }
          }}
        >
          <section className="feature-modal">
            <button
              className="auth-close"
              onClick={() => {
                setItemKind("");
                setEditingItem(null);
              }}
            >
              ×
            </button>

            <span className="section-label">
              {itemKind === "project"
                ? "SHOWCASE YOUR WORK"
                : "CELEBRATE YOUR PROGRESS"}
            </span>

            <h2>
              {editingItem ? "Edit" : "Add"}{" "}
              {itemKind === "project" ? "Project" : "Achievement"}
            </h2>

            <form
              className="profile-form"
              onSubmit={saveDashboardItem}
            >
              <label className="full-field">
                Title
                <input
                  value={itemForm.title}
                  onChange={(event) =>
                    setItemForm({
                      ...itemForm,
                      title: event.target.value,
                    })
                  }
                  required
                  maxLength={100}
                  placeholder={
                    itemKind === "project"
                      ? "My awesome project"
                      : "Achievement title"
                  }
                />
              </label>

              <label className="full-field">
                Description
                <textarea
                  value={itemForm.description}
                  onChange={(event) =>
                    setItemForm({
                      ...itemForm,
                      description: event.target.value,
                    })
                  }
                  required
                  minLength={5}
                  maxLength={1500}
                  rows={4}
                  placeholder="Describe your work or achievement..."
                />
              </label>

              {itemKind === "project" ? (
                <>
                  <label className="full-field">
                    Technologies (comma separated)
                    <input
                      value={itemForm.technologies}
                      onChange={(event) =>
                        setItemForm({
                          ...itemForm,
                          technologies: event.target.value,
                        })
                      }
                      placeholder="React, Firebase, CSS"
                    />
                  </label>

                  <label className="full-field">
                    Thumbnail image URL (optional)
                    <input
                      type="url"
                      value={itemForm.imageURL}
                      onChange={(event) =>
                        setItemForm({
                          ...itemForm,
                          imageURL: event.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </label>

                  <label>
                    GitHub URL
                    <input
                      type="url"
                      value={itemForm.githubURL}
                      onChange={(event) =>
                        setItemForm({
                          ...itemForm,
                          githubURL: event.target.value,
                        })
                      }
                      placeholder="https://github.com/..."
                    />
                  </label>

                  <label>
                    Live Demo URL
                    <input
                      type="url"
                      value={itemForm.liveURL}
                      onChange={(event) =>
                        setItemForm({
                          ...itemForm,
                          liveURL: event.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Achievement date
                    <input
                      type="date"
                      value={itemForm.date}
                      onChange={(event) =>
                        setItemForm({
                          ...itemForm,
                          date: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Certificate URL (optional)
                    <input
                      type="url"
                      value={itemForm.certificateURL}
                      onChange={(event) =>
                        setItemForm({
                          ...itemForm,
                          certificateURL: event.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </label>
                </>
              )}

              {itemError && (
                <p className="auth-error full-field">
                  {itemError}
                </p>
              )}

              <div className="form-actions full-field">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setItemKind("");
                    setEditingItem(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={itemSaving}
                >
                  {itemSaving
                    ? "Saving..."
                    : editingItem
                    ? "Update"
                    : "Save"}{" "}
                  →
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* PUBLIC DEVELOPER DETAIL */}
      {selectedProfile && (
        <div
          className="feature-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedProfile(null);
            }
          }}
        >
          <section className="feature-modal detail-modal">
            <button
              className="auth-close"
              onClick={() => setSelectedProfile(null)}
            >
              ×
            </button>

            <div className="detail-top">
              {selectedProfile.photoURL ? (
                <img
                  className="detail-avatar"
                  src={selectedProfile.photoURL}
                  alt={`${selectedProfile.name} profile`}
                />
              ) : (
                <div className="detail-avatar detail-initials">
                  {initials(selectedProfile.name)}
                </div>
              )}

              <div>
                <span className="section-label">
                  DEVELOPER PROFILE
                </span>

                <h2>{selectedProfile.name}</h2>

                <p className="developer-role">
                  {selectedProfile.role}
                </p>

                <span className="username">
                  @
                  {(selectedProfile.username || "developer").replace(
                    /^@/,
                    ""
                  )}
                </span>
              </div>
            </div>

            <h3 className="detail-subtitle">About</h3>

            <p className="detail-bio">
              {selectedProfile.bio ||
                "This developer has not added a bio yet."}
            </p>

            <h3 className="detail-subtitle">
              Skills & Technologies
            </h3>

            <div className="skill-list detail-skills">
              {(selectedProfile.skills || []).map((skill) => (
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
                .filter((item) => item[1])
                .map(([label, url]) => (
                  <a
                    key={label}
                    className="secondary-button"
                    href={safeUrl(url)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {label} ↗
                  </a>
                ))}
            </div>

            <h3 className="detail-subtitle">Projects</h3>

            {selectedProjects.length === 0 ? (
              <p>No public projects added yet.</p>
            ) : (
              <div className="dashboard-item-list">
                {selectedProjects.map((project) => (
                  <article className="dashboard-item" key={project.id}>
                    {project.imageURL && (
                      <img
                        className="project-thumbnail"
                        src={project.imageURL}
                        alt={project.title}
                      />
                    )}

                    <h4>{project.title}</h4>
                    <p>{project.description}</p>

                    <div className="skill-list">
                      {(project.technologies || []).map((technology) => (
                        <span className="skill-tag" key={technology}>
                          {technology}
                        </span>
                      ))}
                    </div>

                    <div className="detail-links">
                      {project.githubURL && (
                        <a
                          className="secondary-button"
                          href={safeUrl(project.githubURL)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          GitHub ↗
                        </a>
                      )}

                      {project.liveURL && (
                        <a
                          className="secondary-button"
                          href={safeUrl(project.liveURL)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Live Demo ↗
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            <h3 className="detail-subtitle">Achievements</h3>

            {selectedAchievements.length === 0 ? (
              <p>No public achievements added yet.</p>
            ) : (
              <div className="dashboard-item-list">
                {selectedAchievements.map((achievement) => (
                  <article
                    className="dashboard-item"
                    key={achievement.id}
                  >
                    <h4>{achievement.title}</h4>
                    {achievement.date && <small>{achievement.date}</small>}
                    <p>{achievement.description}</p>

                    {achievement.certificateURL && (
                      <a
                        className="secondary-button"
                        href={safeUrl(achievement.certificateURL)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Certificate ↗
                      </a>
                    )}
                  </article>
                ))}
              </div>
            )}

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

      {/* NAVBAR */}
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">&lt;/&gt;</span>
          Dev<span>Directory</span>
          <span className="brand-dot">.</span>
        </a>

        <nav className="nav-links">
          <a className="nav-active" href="#home">Home</a>
          <a href="#developers">Explore Developers</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="logged-user">
                {user.displayName || user.email}
              </span>

              <button
                className="join-button"
                onClick={() => {
                  setShowDashboard(!showDashboard);
                  setShowAdmin(false);
                }}
              >
                {showDashboard ? "Close Dashboard" : "Dashboard"}
              </button>

              <button
                className="join-button"
                onClick={openProfileForm}
              >
                {myProfile ? "Edit Profile" : "Add Profile"}
              </button>

              {isAdmin && (
                <button
                  className="join-button admin-nav-button"
                  onClick={() => {
                    setShowAdmin(!showAdmin);
                    setShowDashboard(false);
                  }}
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
        {/* HERO */}
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

            <button
              className="secondary-button"
              onClick={openProfileForm}
            >
              Add Your Profile +
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <strong>
                {String(
                  profiles.length || demoDevelopers.length
                ).padStart(2, "0")}
              </strong>
              <span>Developer Profiles</span>
            </div>

            <div>
              <strong>
                {new Set(
                  (profiles.length ? profiles : demoDevelopers).flatMap(
                    (profile) => profile.skills || []
                  )
                ).size}
                +
              </strong>
              <span>Skills Listed</span>
            </div>

            <div>
              <strong>∞</strong>
              <span>Ideas to Build</span>
            </div>
          </div>
        </section>

        {/* PERSONAL DASHBOARD */}
        {showDashboard && user && (
          <section className="admin-section personal-dashboard">
            <div className="section-heading">
              <div>
                <span className="section-label">PERSONAL WORKSPACE</span>
                <h2>
                  My <span className="gradient-text">Dashboard.</span>
                </h2>
                <p>
                  Manage your profile, projects and achievements.
                </p>
              </div>
            </div>

            {adminMessage && (
              <p className="status-message">{adminMessage}</p>
            )}

            <div className="dashboard-tabs">
              {[
                ["overview", "Overview"],
                ["projects", "My Projects"],
                ["achievements", "My Achievements"],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  className={`category-button ${
                    dashboardTab === tab ? "category-active" : ""
                  }`}
                  onClick={() => setDashboardTab(tab)}
                >
                  {label}
                </button>
              ))}
            </div>

            {dashboardTab === "overview" && (
              <>
                <div className="dashboard-stats">
                  <article className="dashboard-stat">
                    <span>MY PROJECTS</span>
                    <strong>{myProjects.length}</strong>
                  </article>

                  <article className="dashboard-stat">
                    <span>MY ACHIEVEMENTS</span>
                    <strong>{myAchievements.length}</strong>
                  </article>

                  <article className="dashboard-stat">
                    <span>PROFILE STATUS</span>
                    <strong>{myProfile ? "Ready" : "Incomplete"}</strong>
                  </article>
                </div>

                <div className="dashboard-welcome">
                  <h3>
                    Welcome,{" "}
                    {myProfile?.name || user.displayName || "Developer"}!
                  </h3>

                  <p>
                    Add your work and achievements so other developers
                    can discover what you build.
                  </p>

                  <button
                    className="primary-button"
                    onClick={openProfileForm}
                  >
                    {myProfile ? "Edit My Profile" : "Create My Profile"}
                  </button>
                </div>
              </>
            )}

            {dashboardTab === "projects" && (
              <>
                <div className="section-heading">
                  <div>
                    <h3>My Projects</h3>
                    <p>Only you can manage your projects.</p>
                  </div>

                  <button
                    className="primary-button"
                    onClick={() => openItemForm("project")}
                  >
                    + Add Project
                  </button>
                </div>

                {myProjects.length === 0 ? (
                  <div className="empty-state">
                    <h3>No projects yet</h3>
                    <p>Add your first project to your profile.</p>
                  </div>
                ) : (
                  <div className="dashboard-item-list">
                    {myProjects.map((project) => (
                      <article className="dashboard-item" key={project.id}>
                        {project.imageURL && (
                          <img
                            className="project-thumbnail"
                            src={project.imageURL}
                            alt={project.title}
                          />
                        )}

                        <h4>{project.title}</h4>
                        <p>{project.description}</p>

                        <div className="skill-list">
                          {(project.technologies || []).map((technology) => (
                            <span className="skill-tag" key={technology}>
                              {technology}
                            </span>
                          ))}
                        </div>

                        <div className="detail-links">
                          {project.githubURL && (
                            <a
                              className="secondary-button"
                              href={safeUrl(project.githubURL)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              GitHub ↗
                            </a>
                          )}

                          {project.liveURL && (
                            <a
                              className="secondary-button"
                              href={safeUrl(project.liveURL)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Live Demo ↗
                            </a>
                          )}

                          <button
                            className="secondary-button"
                            onClick={() => openItemForm("project", project)}
                          >
                            Edit
                          </button>

                          <button
                            className="danger-button"
                            onClick={() =>
                              deleteDashboardItem("project", project)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            {dashboardTab === "achievements" && (
              <>
                <div className="section-heading">
                  <div>
                    <h3>My Achievements</h3>
                    <p>Show certificates, awards and milestones.</p>
                  </div>

                  <button
                    className="primary-button"
                    onClick={() => openItemForm("achievement")}
                  >
                    + Add Achievement
                  </button>
                </div>

                {myAchievements.length === 0 ? (
                  <div className="empty-state">
                    <h3>No achievements yet</h3>
                    <p>Add your first achievement or certificate.</p>
                  </div>
                ) : (
                  <div className="dashboard-item-list">
                    {myAchievements.map((achievement) => (
                      <article
                        className="dashboard-item"
                        key={achievement.id}
                      >
                        <h4>{achievement.title}</h4>

                        {achievement.date && (
                          <small>{achievement.date}</small>
                        )}

                        <p>{achievement.description}</p>

                        {achievement.certificateURL && (
                          <a
                            className="secondary-button"
                            href={safeUrl(achievement.certificateURL)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Certificate ↗
                          </a>
                        )}

                        <div className="detail-links">
                          <button
                            className="secondary-button"
                            onClick={() =>
                              openItemForm("achievement", achievement)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="danger-button"
                            onClick={() =>
                              deleteDashboardItem(
                                "achievement",
                                achievement
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ADMIN DASHBOARD */}
        {showAdmin && isAdmin && (
          <section className="admin-section" id="admin-dashboard">
            <div className="section-heading">
              <div>
                <span className="section-label">ADMIN ONLY</span>
                <h2>
                  Admin <span className="gradient-text">Dashboard.</span>
                </h2>
                <p>Review and moderate developer profiles.</p>
              </div>

              <span className="results-count">
                {profiles.length} PROFILES
              </span>
            </div>

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
                        onClick={() => openDeveloperProfile(profile)}
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

        {/* PUBLIC DIRECTORY */}
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

          <div className="search-box">
            <span className="search-icon">⌕</span>

            <input
              type="text"
              placeholder="Search developers, skills, technologies..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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

          {profilesLoading && (
            <p className="loading-message">
              Loading developer directory...
            </p>
          )}

          <div className="developer-grid">
            {visibleProfiles.map((developer, index) => (
              <article
                className="developer-card"
                key={developer.id}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="card-top">
                  {developer.photoURL ? (
                    <img
                      className="avatar profile-card-image"
                      src={developer.photoURL}
                      alt={`${developer.name} avatar`}
                    />
                  ) : (
                    <div
                      className="avatar"
                      style={{
                        "--avatar-color": `hsl(${(index * 43 + 355) % 360} 85% 60%)`,
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
                  {(developer.skills || []).slice(0, 4).map((skill) => (
                    <span className="skill-tag" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>

                <button
                  className="profile-button"
                  onClick={() => openDeveloperProfile(developer)}
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

        {/* ABOUT */}
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

          <button
            className="primary-button"
            onClick={openProfileForm}
          >
            Create Your Profile ↑
          </button>
        </section>
      </main>

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