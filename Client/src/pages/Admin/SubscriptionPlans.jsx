import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ Name: "", SwapLimit: "", Price: "" });
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  // Fetch all subscription plans
  const fetchPlans = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/subscription-plans/all"
      );
      setPlans(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Input validation
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "Name") {
      if (!/^[A-Za-z0-9 ]*$/.test(value)) return;
    } else if (name === "SwapLimit") {
      if (!/^\d*$/.test(value)) return;
    } else if (name === "Price") {
      if (!/^\d*\.?\d*$/.test(value)) return;
    }

    setForm({ ...form, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Validate inputs
  const validateForm = () => {
    let newErrors = {};

    if (!form.Name.trim()) newErrors.Name = "Plan Name is required.";
    else if (!/^[A-Za-z0-9 ]+$/.test(form.Name))
      newErrors.Name = "Only letters, numbers, and spaces are allowed.";

    if (!form.SwapLimit || Number(form.SwapLimit) <= 0)
      newErrors.SwapLimit = "Swap Limit must be greater than 0.";

    if (!form.Price || Number(form.Price) <= 0)
      newErrors.Price = "Price must be greater than 0.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        Name: form.Name.trim(),
        SwapLimit: Number(form.SwapLimit),
        Price: Number(form.Price),
      };

      if (editId) {
        await axios.put(
          `http://localhost:4000/api/subscription-plans/update/${editId}`,
          payload
        );
        toast.success("Plan updated successfully");
      } else {
        await axios.post(
          "http://localhost:4000/api/subscription-plans/add",
          payload
        );
        toast.success("Plan added successfully");
      }

      setForm({ Name: "", SwapLimit: "", Price: "" });
      setEditId(null);
      fetchPlans();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save plan");
    }
  };

  // Edit handler
  const handleEdit = (plan) => {
    setForm({
      Name: plan.Name,
      SwapLimit: plan.SwapLimit || "",
      Price: plan.Price?.$numberDecimal
        ? parseFloat(plan.Price.$numberDecimal)
        : plan.Price || "",
    });
    setEditId(plan._id);
    setErrors({});
  };

  // Toggle Active/Inactive
  const handleStatusToggle = async (plan) => {
    try {
      const newStatus = plan.status === "Active" ? "Inactive" : "Active";
      await axios.put(
        `http://localhost:4000/api/subscription-plans/update/${plan._id}`,
        { status: newStatus }
      );
      fetchPlans();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update plan status");
    }
  };

  if (loading) return <div>Loading...</div>;

  const activePlans = plans.filter((plan) => plan.status === "Active");
  const inactivePlans = plans.filter((plan) => plan.status === "Inactive");

  const accentColors = [
    {
      header: "bg-blue-800",
      primaryBtn:
        "bg-blue-800 text-white hover:bg-blue-900 border border-blue-900",
      secondaryBtn:
        "bg-white text-blue-800 border border-blue-800 hover:bg-blue-50",
    },
    {
      header: "bg-red-800",
      primaryBtn:
        "bg-red-800 text-white hover:bg-red-900 border border-red-900",
      secondaryBtn:
        "bg-white text-red-800 border border-red-800 hover:bg-red-50",
    },
    {
      header: "bg-green-800",
      primaryBtn:
        "bg-green-800 text-white hover:bg-green-900 border border-green-900",
      secondaryBtn:
        "bg-white text-green-800 border border-green-800 hover:bg-green-50",
    },
    {
      header: "bg-purple-800",
      primaryBtn:
        "bg-purple-800 text-white hover:bg-purple-900 border border-purple-900",
      secondaryBtn:
        "bg-white text-purple-800 border border-purple-800 hover:bg-purple-50",
    },
    {
      header: "bg-yellow-700",
      primaryBtn:
        "bg-yellow-700 text-white hover:bg-yellow-800 border border-yellow-800",
      secondaryBtn:
        "bg-white text-yellow-700 border border-yellow-700 hover:bg-yellow-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/60 bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 px-6 py-5 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">
          Manage Subscription Plans
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Create elegant plans with colorful cards.
        </p>
      </div>

      {/* FORM */}
      <div className="rounded-xl border border-gray-100 bg-white/80 p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          {editId ? "Edit Plan" : "Add New Plan"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Plan Name
            </label>
            <input
              type="text"
              name="Name"
              value={form.Name}
              onChange={handleChange}
              placeholder="e.g. Basic, Pro, Premium"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition
                ${
                  errors.Name
                    ? "border-red-400 focus:ring-2 focus:ring-red-200"
                    : "border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                }`}
            />
            {errors.Name && (
              <p className="mt-1 text-xs text-red-500">{errors.Name}</p>
            )}
          </div>

          {/* Swap Limit + Price */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Swap Limit
              </label>
              <input
                type="number"
                name="SwapLimit"
                value={form.SwapLimit}
                onChange={handleChange}
                placeholder="e.g. 10"
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition
                  ${
                    errors.SwapLimit
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  }`}
              />
              {errors.SwapLimit && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.SwapLimit}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Price (₹)
              </label>
              <input
                type="text"
                name="Price"
                value={form.Price}
                onChange={handleChange}
                placeholder="e.g. 199.00"
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition
                  ${
                    errors.Price
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  }`}
              />
              {errors.Price && (
                <p className="mt-1 text-xs text-red-500">{errors.Price}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-gradient-to-r from-indigo-300 to-sky-300 px-5 py-2 text-sm font-medium text-gray-800 shadow-sm hover:from-indigo-400 hover:to-sky-400"
            >
              {editId ? "Update Plan" : "Add Plan"}
            </button>

            {editId && (
              <button
                type="button"
                onClick={() => {
                  setForm({ Name: "", SwapLimit: "", Price: "" });
                  setEditId(null);
                  setErrors({});
                }}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ACTIVE PLANS */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Active Plans</h2>

        {activePlans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activePlans.map((plan, index) => {
              const accent = accentColors[index % accentColors.length];

              return (
                <div
                  key={plan._id}
                  className="bg-white shadow-md border border-gray-200 overflow-hidden flex flex-col"
                >
                  <div
                    className={`${accent.header} h-16 w-full px-4 flex items-center justify-between`}
                  >
                    <span className="text-white font-semibold text-sm">
                      {plan.Name}
                    </span>
                    <span className="bg-white/90 text-gray-700 text-xs px-3 py-1 rounded-full shadow-sm">
                      Active
                    </span>
                  </div>

                  <div className="px-6 py-5 text-center">
                    <p className="text-sm text-gray-600">Subscription Plan</p>

                    <div className="mt-4 flex justify-between text-sm text-gray-700">
                      <div className="flex flex-col items-center flex-1">
                        <span className="font-semibold text-lg">
                          {plan.SwapLimit}
                        </span>
                        <span className="text-xs text-gray-500">
                          Swap Limit
                        </span>
                      </div>

                      <div className="flex flex-col items-center flex-1">
                        <span className="font-semibold text-lg">
                          ₹
                          {plan.Price?.$numberDecimal
                            ? parseFloat(plan.Price.$numberDecimal)
                            : plan.Price}
                        </span>
                        <span className="text-xs text-gray-500">Price</span>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => handleEdit(plan)}
                        className={`flex-1 px-4 py-2 text-xs font-medium rounded-full ${accent.secondaryBtn}`}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleStatusToggle(plan)}
                        className={`flex-1 px-4 py-2 text-xs font-medium rounded-full ${accent.primaryBtn}`}
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No active plans available.</p>
        )}
      </div>

      {/* INACTIVE PLANS */}
      {inactivePlans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Inactive Plans
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {inactivePlans.map((plan, index) => {
              const accent =
                accentColors[(index + 2) % accentColors.length];

              return (
                <div
                  key={plan._id}
                  className="bg-white shadow-md border border-gray-200 overflow-hidden flex flex-col"
                >
                  <div
                    className={`${accent.header} h-16 w-full px-4 flex items-center justify-between opacity-80`}
                  >
                    <span className="text-white font-semibold text-sm">
                      {plan.Name}
                    </span>
                    <span className="bg-white/90 text-gray-700 text-xs px-3 py-1 rounded-full shadow-sm">
                      Inactive
                    </span>
                  </div>

                  <div className="px-6 py-5 text-center">
                    <p className="text-sm text-gray-600">Subscription Plan</p>

                    <div className="mt-4 flex justify-between text-sm text-gray-700">
                      <div className="flex flex-col items-center flex-1">
                        <span className="font-semibold text-lg">
                          {plan.SwapLimit}
                        </span>
                        <span className="text-xs text-gray-500">
                          Swap Limit
                        </span>
                      </div>

                      <div className="flex flex-col items-center flex-1">
                        <span className="font-semibold text-lg">
                          ₹
                          {plan.Price?.$numberDecimal
                            ? parseFloat(plan.Price.$numberDecimal)
                            : plan.Price}
                        </span>
                        <span className="text-xs text-gray-500">Price</span>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => handleStatusToggle(plan)}
                        className={`flex-1 px-4 py-2 text-xs font-medium rounded-full ${accent.primaryBtn}`}
                      >
                        Activate
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
