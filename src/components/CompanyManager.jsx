import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import {
  getCompanies,
  addCompany,
  updateCompany,
  deleteCompany,
} from "../utils/companyStorage";
import "./CompanyManager.css";

const CompanyManager = () => {
  const [companies, setCompanies] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    nameHindi: "",
    address: "",
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const data = await getCompanies();
    setCompanies(data);
  };

  const handleAdd = async () => {
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    const newCompany = await addCompany(formData);
    setCompanies([...companies, newCompany]);
    resetForm();
    toast.success("Company added");
  };

  const handleUpdate = async () => {
    const updated = await updateCompany(editingId, formData);

    setCompanies(companies.map((c) => (c._id === editingId ? updated : c)));
    setCompanies(
      companies.map((c) => (c._id === editingId ? { ...c, ...formData } : c)),
    );

    resetForm();
    toast.success("Company updated");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this company?")) {
      await deleteCompany(id);
      setCompanies(companies.filter((c) => c._id !== id));
      toast.success("Deleted");
    }
  };

  const handleEdit = (company) => {
    setEditingId(company._id);
    setFormData(company);
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: "", nameHindi: "", address: "" });
    setShowForm(false);
  };

  return (
    <div className="company-manager">
      <div className="header">
        <h2>Manage Companies</h2>

        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-add">
            <FiPlus /> Add Company
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <input
              placeholder="Company Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <input
              placeholder="Company Name (Hindi)"
              value={formData.nameHindi}
              onChange={(e) =>
                setFormData({ ...formData, nameHindi: e.target.value })
              }
            />

            <textarea
              placeholder="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />

            <div className="actions">
              <button
                className="btn-save"
                onClick={editingId ? handleUpdate : handleAdd}
              >
                <FiSave />
                {editingId ? "Update" : "Save"}
              </button>

              <button className="btn-cancel" onClick={resetForm}>
                <FiX /> Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="list">
        {companies.map((c) => (
          <div key={c._id} className="card">
            <div className="card-content">
              <h4 className="company-name">{c.name}</h4>

              {c.nameHindi && <p className="company-hindi">{c.nameHindi}</p>}

              {c.address && (
                <small className="company-address">{c.address}</small>
              )}
            </div>

            <div className="actions card-actions">
              <button onClick={() => handleEdit(c)}>
                <FiEdit2 />
              </button>

              <button onClick={() => handleDelete(c._id)}>
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyManager;
