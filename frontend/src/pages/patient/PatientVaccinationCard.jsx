import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Syringe, ArrowLeft, Calendar, ShieldCheck, User, Phone, Download } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PatientVaccinationCard = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);
  const [vaccines, setVaccines] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [brandPrices, setBrandPrices] = useState({});

  // 1. Fetch Patient Vaccination Card details from backend
  const fetchVaccinationCard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get(`/api/v1/patients/vaccination-card/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const patientRecord = response.data?.data;

      if (patientRecord) {
        setPatientData(patientRecord);
        setVaccines(patientRecord.patientVaccines || []);
      }
    } catch (error) {
      console.error("Failed to fetch vaccination card:", error);
      toast.error(error.response?.data?.message || "Failed to load vaccination card.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch vaccine brand prices (brandName -> price)
  const fetchBrandPrices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/vaccine-brands', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const map = {};
      (response.data?.data || []).forEach((b) => {
        map[b.brandName] = b.price;
      });
      setBrandPrices(map);
    } catch (error) {
      console.error("Failed to fetch brand prices:", error);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchVaccinationCard();
      fetchBrandPrices();
    }
  }, [patientId]);

  // 2. Update Vaccine Given Date Function (Direct quick update)
  const handleVaccineUpdate = async (vaccineSubDocId, updatedFields) => {
    try {
      setUpdatingId(vaccineSubDocId);
      const token = localStorage.getItem('token');

      const response = await axios.patch(
        `/api/v1/patients/vaccination-card/${patientId}/vaccine/${vaccineSubDocId}`,
        updatedFields,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      const updatedRecord = response.data?.data;
      if (updatedRecord) {
        setPatientData(updatedRecord);
        setVaccines(updatedRecord.patientVaccines || []);
        toast.success("Vaccine record updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update vaccine status:", error);
      toast.error(error.response?.data?.message || "Failed to update vaccine status.");
      fetchVaccinationCard();
    } finally {
      setUpdatingId(null);
    }
  };

  // 3. PDF Download Handler for a Specific Due Date Group
  const downloadGroupPDF = (dueDate, groupItems) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 14;

      // Colors
      const DARK = [15, 23, 42];
      const EMERALD = [16, 185, 129];
      const MUTED = [100, 116, 139];

      // Clinic & Doctor names (backend se populate hoke aate hain)
      const clinicName = patientData?.clinicId?.clinicName || 'N/A';
      const rawDoctorName = patientData?.doctorId?.name || 'N/A';
      const doctorName = /^dr\.?\s/i.test(rawDoctorName) || rawDoctorName === 'N/A'
        ? rawDoctorName
        : `Dr. ${rawDoctorName}`;

      // ---------- Header Band ----------
      doc.setFillColor(...DARK);
      doc.rect(0, 0, pageWidth, 36, 'F');
      doc.setFillColor(...EMERALD);
      doc.rect(0, 36, pageWidth, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(21);
      doc.setTextColor(255, 255, 255);
      doc.text(doc.splitTextToSize(clinicName, pageWidth - 90)[0], marginX, 17);

      doc.setFontSize(11);
      doc.setTextColor(110, 231, 183);
      doc.text(doctorName, marginX, 27);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth - marginX, 17, { align: 'right' });

      // ---------- Report Title ----------
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(...DARK);
      doc.text("Immunization Status Report", marginX, 52);

      // ---------- Patient Info Box ----------
      const boxY = 58;
      const boxH = 34;
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, boxY, pageWidth - marginX * 2, boxH, 3, 3, 'FD');
      doc.setFillColor(...EMERALD);
      doc.rect(marginX, boxY + 3, 1.2, boxH - 6, 'F'); // left accent line

      const drawField = (label, value, x, y) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text(label.toUpperCase(), x, y);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...DARK);
        doc.text(doc.splitTextToSize(String(value), 80)[0], x, y + 6);
      };

      const col1 = marginX + 7;
      const col2 = pageWidth / 2 + 4;
      drawField("Patient Name", patientData?.patientName || 'N/A', col1, boxY + 9);
      drawField("Father's Name", patientData?.fatherName || 'N/A', col2, boxY + 9);
      drawField("Recommended Due Date", dueDate, col1, boxY + 23);
      drawField("Total Vaccines", groupItems.length, col2, boxY + 23);

      // ---------- Table Data ----------
      const tableColumn = ["Vaccine Name", "Status", "Given Date", "Price (Rs)"];
      const tableRows = [];
      let totalPrice = 0;

      groupItems.forEach((item) => {
        const vName = item.scheduleId?.name || item.vaccineName || 'Unknown Vaccine';
        const vStatus = item.status || 'Pending';
        const vDate = item.givenDate ? new Date(item.givenDate).toISOString().split('T')[0] : 'Pending';

        // Price sirf Given vaccine ki show hogi
        const isGiven = item.status === 'Given';
        const price = isGiven ? Number(brandPrices[item.brandName] ?? 0) : null;
        if (isGiven) totalPrice += price;

        tableRows.push([vName, vStatus, vDate, isGiven ? price.toLocaleString('en-US') : '-']);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        foot: [["", "", "Total", `Rs ${totalPrice.toLocaleString('en-US')}`]],
        startY: boxY + boxH + 8,
        margin: { top: 20, left: marginX, right: marginX, bottom: 22 },
        theme: 'striped',
        styles: {
          font: 'helvetica',
          fontSize: 9.5,
          cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
          textColor: [30, 41, 59],
        },
        headStyles: { fillColor: DARK, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        footStyles: { fillColor: [236, 253, 245], textColor: [6, 95, 70], fontStyle: 'bold', fontSize: 10.5 },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 28, halign: 'center' },
          2: { cellWidth: 34, halign: 'center' },
          3: { cellWidth: 32, halign: 'right' },
        },
        // Status ko color dena (Given = green, Pending = amber)
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = data.cell.raw === 'Given' ? [4, 120, 87] : [180, 83, 9];
          }
        },
      });

      // ---------- Footer (har page par) ----------
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(marginX, pageHeight - 16, pageWidth - marginX, pageHeight - 16);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text("This is a computer-generated report.", marginX, pageHeight - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 10, { align: 'right' });
      }

      // Save PDF File
      doc.save(`Vaccination_Report_${dueDate.replace(/\//g, '-')}.pdf`);
      toast.success(`PDF downloaded for Due Date: ${dueDate}`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast.error("Failed to download PDF report.");
    }
  };

  // Helper: Group vaccines by their Due Date
  const groupedVaccines = vaccines.reduce((groups, item) => {
    const dueDateKey = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A';
    if (!groups[dueDateKey]) {
      groups[dueDateKey] = [];
    }
    groups[dueDateKey].push(item);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-[#0b1329] border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Vaccination Card</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Detailed immunization schedule and tracking record
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-11 h-11 bg-slate-800/80 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !patientData ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <p className="text-slate-400 text-sm">Patient record not found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Patient Info Summary Card */}
          <div className="bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/15 text-blue-400 rounded-xl border border-blue-500/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Patient Name</p>
                <p className="text-sm font-bold text-white">{patientData.patientName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600/15 text-purple-400 rounded-xl border border-purple-500/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Father's Name</p>
                <p className="text-sm font-bold text-white">{patientData.fatherName || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600/15 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Date of Birth</p>
                <p className="text-sm font-bold text-white">
                  {patientData.dateOfBirth ? new Date(patientData.dateOfBirth).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-600/15 text-amber-400 rounded-xl border border-amber-500/20">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Contact Number</p>
                <p className="text-sm font-bold text-white">
                  {patientData.phone || patientData.contactNumber || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Vaccines Grouped View */}
          <div className="bg-[#0b1329]/80 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5">
            <div className="pb-4 mb-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>Immunization Schedule List</span>
              </h3>
              <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg">
                Total Vaccines: {vaccines.length}
              </span>
            </div>

            <div>
              {vaccines.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No vaccines scheduled for this patient.
                </div>
              ) : (
                Object.entries(groupedVaccines).map(([dueDate, groupItems], groupIndex) => (
                  <div
                    key={groupIndex}
                    className="mb-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-lg overflow-hidden last:mb-0"
                  >
                    {/* Due Date Card Header with PDF Download Button */}
                    <div className="bg-slate-900/90 px-5 py-3 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-400 text-xs font-bold tracking-wider">
                      <div className="flex items-center justify-center gap-2 flex-1 text-center sm:text-left">
                        <Calendar className="w-4 h-4" />
                        <span>Recommended Due Date: {dueDate}</span>
                        <span className="text-slate-400 font-normal">({groupItems.length} Vaccines)</span>
                      </div>

                      {/* PDF Export Button */}
                      <button
                        onClick={() => downloadGroupPDF(dueDate, groupItems)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl transition text-xs font-medium tracking-normal normal-case"
                        title="Download status report for this due date"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF Report</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800/40 bg-slate-900/30 text-xs text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-4 font-semibold">Given Date</th>
                            <th className="py-3 px-4 font-semibold">Vaccine Name</th>
                            <th className="py-3 px-4 font-semibold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-sm">
                          {groupItems.map((item, index) => {
                            const vaccineName = item.scheduleId?.name || item.vaccineName || 'Unknown Vaccine';
                            const isGiven = item.status === "Given";

                            return (
                              <tr
                                key={item._id || index}
                                className={`transition ${isGiven
                                    ? "bg-emerald-900/20 hover:bg-emerald-900/30 border-l-4 border-emerald-500"
                                    : "hover:bg-slate-900/45"
                                  }`}
                              >
                                <td className="py-3.5 px-4">
                                  <span className={`text-xs ${isGiven ? "text-emerald-400 font-medium" : "text-slate-300"}`}>
                                    {item.givenDate ? new Date(item.givenDate).toISOString().split('T')[0] : 'Pending'}
                                  </span>
                                </td>

                                <td className={`py-3.5 px-4 font-bold ${isGiven ? "text-emerald-200" : "text-white"}`}>
                                  {vaccineName}
                                </td>

                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    onClick={() => navigate(`/dashboard/update-vaccine/${patientId}/${item._id}`)}
                                    title="Manage Status & Brand Name on New Page"
                                    className="p-2 bg-blue-600/15 text-blue-400 hover:bg-blue-600/30 rounded-xl transition border border-blue-500/30 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3.5"
                                  >
                                    <Syringe className="w-4 h-4 text-blue-400" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientVaccinationCard;