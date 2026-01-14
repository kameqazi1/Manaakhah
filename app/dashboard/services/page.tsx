"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMockSession } from "@/components/mock-session-provider";
import Link from "next/link";

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  priceType: "fixed" | "starting" | "hourly" | "custom";
  duration?: number; // in minutes
  category: string;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
}

const PRICE_TYPES = [
  { value: "fixed", label: "Fixed Price" },
  { value: "starting", label: "Starting From" },
  { value: "hourly", label: "Per Hour" },
  { value: "custom", label: "Contact for Quote" },
];

export default function ServiceMenuPage() {
  const { data: session } = useMockSession();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);

  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: 0,
    priceType: "fixed" as ServiceItem["priceType"],
    duration: "",
    category: "",
    isFeatured: false,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load services
    const savedServices = localStorage.getItem("businessServices");
    if (savedServices) {
      try {
        const allServices = JSON.parse(savedServices);
        const userServices = allServices.filter((s: ServiceItem & { businessId: string }) =>
          s.businessId === session?.user?.id
        );
        setServices(userServices.sort((a: ServiceItem, b: ServiceItem) => a.sortOrder - b.sortOrder));
      } catch {
        setServices([]);
      }
    }

    // Load categories
    const savedCategories = localStorage.getItem("serviceCategories");
    if (savedCategories) {
      try {
        const allCategories = JSON.parse(savedCategories);
        const userCategories = allCategories.filter((c: ServiceCategory & { businessId: string }) =>
          c.businessId === session?.user?.id
        );
        setCategories(userCategories.sort((a: ServiceCategory, b: ServiceCategory) => a.sortOrder - b.sortOrder));
      } catch {
        setCategories([]);
      }
    }

    setLoading(false);
  };

  const saveServices = (updatedServices: ServiceItem[]) => {
    const savedServices = localStorage.getItem("businessServices");
    let allServices = savedServices ? JSON.parse(savedServices) : [];
    allServices = allServices.filter((s: ServiceItem & { businessId: string }) =>
      s.businessId !== session?.user?.id
    );
    const servicesWithBusinessId = updatedServices.map(s => ({
      ...s,
      businessId: session?.user?.id
    }));
    allServices = [...allServices, ...servicesWithBusinessId];
    localStorage.setItem("businessServices", JSON.stringify(allServices));
    setServices(updatedServices.sort((a, b) => a.sortOrder - b.sortOrder));
  };

  const saveCategories = (updatedCategories: ServiceCategory[]) => {
    const savedCategories = localStorage.getItem("serviceCategories");
    let allCategories = savedCategories ? JSON.parse(savedCategories) : [];
    allCategories = allCategories.filter((c: ServiceCategory & { businessId: string }) =>
      c.businessId !== session?.user?.id
    );
    const categoriesWithBusinessId = updatedCategories.map(c => ({
      ...c,
      businessId: session?.user?.id
    }));
    allCategories = [...allCategories, ...categoriesWithBusinessId];
    localStorage.setItem("serviceCategories", JSON.stringify(allCategories));
    setCategories(updatedCategories.sort((a, b) => a.sortOrder - b.sortOrder));
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newService: ServiceItem = {
      id: editingService?.id || Date.now().toString(),
      name: serviceForm.name,
      description: serviceForm.description,
      price: serviceForm.price,
      priceType: serviceForm.priceType,
      duration: serviceForm.duration ? parseInt(serviceForm.duration) : undefined,
      category: serviceForm.category,
      isAvailable: true,
      isFeatured: serviceForm.isFeatured,
      sortOrder: editingService?.sortOrder || services.length,
    };

    let updatedServices;
    if (editingService) {
      updatedServices = services.map((s) => (s.id === editingService.id ? newService : s));
    } else {
      updatedServices = [...services, newService];
    }

    saveServices(updatedServices);
    resetServiceForm();
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCategory: ServiceCategory = {
      id: editingCategory?.id || Date.now().toString(),
      name: categoryForm.name,
      description: categoryForm.description,
      sortOrder: editingCategory?.sortOrder || categories.length,
    };

    let updatedCategories;
    if (editingCategory) {
      updatedCategories = categories.map((c) => (c.id === editingCategory.id ? newCategory : c));
    } else {
      updatedCategories = [...categories, newCategory];
    }

    saveCategories(updatedCategories);
    resetCategoryForm();
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: "",
      description: "",
      price: 0,
      priceType: "fixed",
      duration: "",
      category: "",
      isFeatured: false,
    });
    setShowServiceModal(false);
    setEditingService(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", description: "" });
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const handleEditService = (service: ServiceItem) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description,
      price: service.price,
      priceType: service.priceType,
      duration: service.duration?.toString() || "",
      category: service.category,
      isFeatured: service.isFeatured,
    });
    setShowServiceModal(true);
  };

  const handleEditCategory = (category: ServiceCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
    });
    setShowCategoryModal(true);
  };

  const handleToggleAvailability = (serviceId: string) => {
    const updatedServices = services.map((s) =>
      s.id === serviceId ? { ...s, isAvailable: !s.isAvailable } : s
    );
    saveServices(updatedServices);
  };

  const handleDeleteService = (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    const updatedServices = services.filter((s) => s.id !== serviceId);
    saveServices(updatedServices);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const hasServices = services.some((s) => s.category === categoryId);
    if (hasServices) {
      alert("Cannot delete category with services. Please move or delete the services first.");
      return;
    }
    if (!confirm("Are you sure you want to delete this category?")) return;
    const updatedCategories = categories.filter((c) => c.id !== categoryId);
    saveCategories(updatedCategories);
  };

  const formatPrice = (service: ServiceItem) => {
    if (service.priceType === "custom") return "Contact for Quote";
    const priceStr = `$${service.price.toFixed(2)}`;
    switch (service.priceType) {
      case "starting":
        return `From ${priceStr}`;
      case "hourly":
        return `${priceStr}/hr`;
      default:
        return priceStr;
    }
  };

  const getServicesByCategory = (categoryId: string) => {
    return services.filter((s) => s.category === categoryId);
  };

  const getUncategorizedServices = () => {
    return services.filter((s) => !s.category || !categories.find((c) => c.id === s.category));
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Please log in to manage services.</p>
            <Link href="/auth/signin">
              <Button className="mt-4">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Service Menu</h1>
          <p className="text-gray-600">Manage your services and pricing</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <Button variant="outline" onClick={() => setShowCategoryModal(true)}>
            + Add Category
          </Button>
          <Button onClick={() => setShowServiceModal(true)}>
            + Add Service
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{services.length}</div>
            <div className="text-sm text-gray-600">Total Services</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {services.filter((s) => s.isAvailable).length}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{categories.length}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {services.filter((s) => s.isFeatured).length}
            </div>
            <div className="text-sm text-gray-600">Featured</div>
          </CardContent>
        </Card>
      </div>

      {/* Service List */}
      {loading ? (
        <div className="text-center py-8">Loading services...</div>
      ) : services.length === 0 && categories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <span className="text-4xl block mb-4">📋</span>
            <h3 className="font-semibold text-lg mb-2">No services yet</h3>
            <p className="text-gray-600 mb-4">Create categories and add your services with pricing!</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setShowCategoryModal(true)}>
                Add Category First
              </Button>
              <Button onClick={() => setShowServiceModal(true)}>Add Service</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Categorized Services */}
          {categories.map((category) => {
            const categoryServices = getServicesByCategory(category.id);
            return (
              <Card key={category.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{category.name}</CardTitle>
                    {category.description && (
                      <p className="text-sm text-gray-500">{category.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {categoryServices.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No services in this category</p>
                  ) : (
                    <div className="space-y-3">
                      {categoryServices.map((service) => (
                        <div
                          key={service.id}
                          className={`flex items-start justify-between p-3 rounded-lg border ${
                            !service.isAvailable ? "bg-gray-50 opacity-60" : service.isFeatured ? "bg-yellow-50 border-yellow-200" : ""
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{service.name}</span>
                              {service.isFeatured && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                                  Featured
                                </span>
                              )}
                              {!service.isAvailable && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                                  Unavailable
                                </span>
                              )}
                            </div>
                            {service.description && (
                              <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                            )}
                            {service.duration && (
                              <p className="text-xs text-gray-500 mt-1">
                                Duration: {service.duration} min
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-green-600">{formatPrice(service)}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditService(service)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAvailability(service.id)}
                              >
                                {service.isAvailable ? "Hide" : "Show"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600"
                                onClick={() => handleDeleteService(service.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Uncategorized Services */}
          {getUncategorizedServices().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Other Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getUncategorizedServices().map((service) => (
                    <div
                      key={service.id}
                      className={`flex items-start justify-between p-3 rounded-lg border ${
                        !service.isAvailable ? "bg-gray-50 opacity-60" : ""
                      }`}
                    >
                      <div className="flex-1">
                        <span className="font-semibold">{service.name}</span>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-green-600">{formatPrice(service)}</span>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleEditService(service)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingService ? "Edit Service" : "Add New Service"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleServiceSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Service Name</label>
                  <Input
                    required
                    placeholder="e.g., Oil Change"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    placeholder="Describe what's included..."
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                  >
                    <option value="">No Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price Type</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={serviceForm.priceType}
                      onChange={(e) => setServiceForm({ ...serviceForm, priceType: e.target.value as ServiceItem["priceType"] })}
                    >
                      {PRICE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {serviceForm.priceType !== "custom" && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Price ($)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={serviceForm.price}
                        onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes, optional)</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 30"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={serviceForm.isFeatured}
                    onChange={(e) => setServiceForm({ ...serviceForm, isFeatured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isFeatured" className="text-sm">
                    Feature this service (highlight on profile)
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingService ? "Save Changes" : "Add Service"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetServiceForm} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingCategory ? "Edit Category" : "Add Category"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category Name</label>
                  <Input
                    required
                    placeholder="e.g., Maintenance Services"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description (optional)</label>
                  <Textarea
                    placeholder="Brief description of this category..."
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingCategory ? "Save Changes" : "Add Category"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetCategoryForm} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
