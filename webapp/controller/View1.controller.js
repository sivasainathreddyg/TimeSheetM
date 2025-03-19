sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";
    var that;

    return Controller.extend("timesheet.controller.View1", {
        onInit: function () {
            var that = this;
            var oData = {
                employees: [
                    { name: "Nageswara", client: "Karlstorz", project: "KS US Support", clientId: "NRALLA.EXT" },
                    { name: "Raju Dasi", client: "Karlstorz", project: "KS US Support", clientId: "RDASI.EXT" },
                    { name: "Pavan kumar Bassa", client: "Karlstorz", project: "KS US Support", clientId: "SAPAVNB.EXT" },
                    { name: "Rakesh Gattu", client: "Karlstorz", project: "KS US Support", clientId: "RAGATTU.EXT" },
                    { name: "Mohan pentakota", client: "Karlstorz", project: "KS US Support", clientId: "MOPENTAK.EXT" }
                ],
                years: [
                    { year: "2024" }, { year: "2025" }, { year: "2026" }
                ],
                months: [
                    { month: "January" }, { month: "February" }, { month: "March" },
                    { month: "April" }, { month: "May" }, { month: "June" },
                    { month: "July" }, { month: "August" }, { month: "September" },
                    { month: "October" }, { month: "November" }, { month: "December" }
                ]
            };
            var oVizFrame = this.getView().byId("leaveChart");
            if (oVizFrame) {
                oVizFrame.setVizProperties({
                    valueAxis: {
                        title: {
                            visible: true
                        },
                        label: {
                            formatString: "L0" // Format to display whole numbers only
                        },
                        scale: {
                            fixedRange: true, // Prevents auto-scaling
                            minValue: 1,
                            maxValue: 6 // Set based on expected max leaves
                        }
                    },
                    categoryAxis: {
                        title: {
                            visible: true
                        }
                    },
                    plotArea: {
                        dataLabel: {
                            visible: true
                        }
                    }
                });
            }

            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel);
        },

        onYearMonthChange: function () {
            var oView = this.getView();
            var sYear = oView.byId("yearComboBox").getSelectedKey();
            var sMonth = oView.byId("monthComboBox").getSelectedKey();
            if (!sYear || !sMonth) return;

            var oTable = oView.byId("timesheetTable");
            oTable.destroyColumns();
            oTable.destroyItems();

            // Enable scrollable table
            oTable.setProperty("fixedLayout", false);
            oTable.setProperty("width", "auto");

            // Get number of days in selected month
            var iMonthIndex = new Date(Date.parse(sMonth + " 1, " + sYear)).getMonth();
            var iDaysInMonth = new Date(sYear, iMonthIndex + 1, 0).getDate();

            // **Invisible Employee Name Column**
            var oEmployeeColumn = new sap.m.Column({
                header: new sap.m.Text({ text: "Employee Name" }),
                visible: false // 👈 Hide the column in UI
            });
            oTable.addColumn(oEmployeeColumn);

            for (var i = 1; i <= iDaysInMonth; i++) {
                var oDate = new Date(sYear, iMonthIndex, i);
                var sDay = oDate.toLocaleDateString("en-US", { weekday: "short" });

                var oColumn = new sap.m.Column({
                    header: new sap.m.Text({ text: sMonth.substring(0, 3) + "-" + (i < 10 ? "0" + i : i) }),
                    width: "80px"
                });

                oTable.addColumn(oColumn);
            }

            oTable.addColumn(new sap.m.Column({
                header: new sap.m.Text({ text: "Total" }),
                width: "120px"
            }));

            var oModel = this.getView().getModel();
            var aEmployees = oModel.getProperty("/employees");

            aEmployees.forEach(function (oEmployee) {
                var oRow = new sap.m.ColumnListItem();
                var iTotalHours = 0;

                // **Hidden Employee Name Cell**
                oRow.addCell(new sap.m.Text({
                    text: oEmployee.name,
                    visible: false // 👈 Hide this text field in UI
                }));

                for (var i = 1; i <= iDaysInMonth; i++) {
                    var oDate = new Date(sYear, iMonthIndex, i);
                    var sDay = oDate.toLocaleDateString("en-US", { weekday: "short" });

                    var oCell;
                    if (sDay === "Sat" || sDay === "Sun") {
                        oCell = new sap.m.Input({ value: "", editable: false, width: "60px" });; // Non-editable for weekends
                    } else {
                        oCell = new sap.m.Input({
                            value: "8",
                            editable: true,
                            width: "60px",
                            change: function (oEvent) {
                                this.onCellValueChange(oEvent);
                            }.bind(this) // ✅ Bind to the controller
                        });
                        iTotalHours += 8;
                    }

                    oRow.addCell(oCell);
                }

                oRow.addCell(new sap.m.Input({
                    value: iTotalHours.toString(),
                    width: "70px"
                }));

                oTable.addItem(oRow);

            }, this);
        },
        // onCellValueChange: function (oEvent) {
        //     var oInput = oEvent.getSource();
        //     var oRow = oInput.getParent(); // Get the current row
        //     var iTotal = 0;


        //     oRow.getCells().forEach(function (oCell, index, aCells) {
        //         if (index > 0 && index < aCells.length - 1) { // ✅ Skip first and last columns
        //             var iValue = parseInt(oCell.getValue(), 10);
        //             iTotal += isNaN(iValue) ? 0 : iValue;
        //         }
        //     });

        //     // Update the total column
        //     var oTotalCell = oRow.getCells()[oRow.getCells().length - 1];
        //     oTotalCell.setValue(iTotal.toString());
        // },
        onCellValueChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var oRow = oInput.getParent(); // Get the row
            var iTotal = 0;
            var iLeaveCount = 0;

            oRow.getCells().forEach(function (oCell, index, aCells) {
                if (index > 0 && index < aCells.length - 1) { // ✅ Skip first (name) & last (total) columns
                    var sValue = oCell.getValue().trim();

                    if (sValue === "L") { // ✅ Count only "L" as Leave
                        iLeaveCount++;
                    } else {
                        var iValue = parseInt(sValue, 10);
                        iTotal += isNaN(iValue) ? 0 : iValue;
                    }
                }
            });

            // Update the total column
            var oTotalCell = oRow.getCells()[oRow.getCells().length - 1];
            oTotalCell.setValue(iTotal.toString());

            // Store Leave Count in Model for Chart
            var oModel = this.getView().getModel();
            var aEmployees = oModel.getProperty("/employees");

            var sEmployeeName = oRow.getCells()[0].getText(); // Get Employee Name
            aEmployees.forEach(function (oEmp) {
                if (oEmp.name === sEmployeeName) {
                    oEmp.leaveCount = iLeaveCount; // Update leave count
                }
            });

            oModel.setProperty("/employees", aEmployees);
            this.updateChart();
        },
        updateChart: function () {
            var oChart = this.getView().byId("leaveChart");
            

            var oModel = this.getView().getModel();
            oChart.setModel(oModel);
            oChart.getModel().refresh(true);
        },
       


        OnDownloaddata: function () {
            var oEmployeeTable = this.byId("employeeTable");
            var oTimesheetTable = this.byId("timesheetTable");

            // Ensure SheetJS is available
            if (typeof XLSX === "undefined") {
                sap.m.MessageToast.show("SheetJS library is missing!");
                return;
            }

            // **Get Employee Data (Master Table)**
            var aEmployeeData = [];
            var aEmployeeItems = oEmployeeTable.getItems();

            aEmployeeItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext();
                if (oContext) {
                    aEmployeeData.push(oContext.getObject());
                }
            });

            // **Extract Column Headers (Dates)**
            var aColumns = oTimesheetTable.getColumns();
            var aDateHeaders = [];

            // Extract date headers (skip the last column "Total")
            for (var i = 1; i < aColumns.length - 1; i++) { // Skip first (invisible Employee column)
                var sHeaderText = aColumns[i].getHeader().getText();
                aDateHeaders.push(sHeaderText);
            }

            // **Get Timesheet Data (Detail Table)**
            var aTimesheetData = [];
            var aTableItems = oTimesheetTable.getItems();

            aTableItems.forEach(function (oItem) {
                var aCells = oItem.getCells();
                var oRowData = {};

                // **Extract Employee Name**
                var sEmployeeName = aCells[0].getText(); // Employee Name is stored in the first hidden column
                oRowData["Employee Name"] = sEmployeeName;

                // **Map values to corresponding date columns**
                for (var i = 1; i < aDateHeaders.length + 1; i++) { // Start from index 1 (skip Employee Name)
                    var oInput = aCells[i];
                    if (oInput instanceof sap.m.Input) {
                        oRowData[aDateHeaders[i - 1]] = oInput.getValue() || "0";
                    }
                }

                // **Add Total Hours**
                oRowData["Total Hours"] = aCells[aCells.length - 1].getValue() || "0";

                aTimesheetData.push(oRowData);
            });

            // **Convert JSON Data to Excel Format**
            var wb = XLSX.utils.book_new();

            // Add Employee Data as Sheet
            var wsEmployees = XLSX.utils.json_to_sheet(aEmployeeData);
            XLSX.utils.book_append_sheet(wb, wsEmployees, "Employees");

            // Add Timesheet Data as Sheet with Employee Name
            var wsTimesheet = XLSX.utils.json_to_sheet(aTimesheetData);
            XLSX.utils.book_append_sheet(wb, wsTimesheet, "Timesheet");

            // **Download Excel File**
            XLSX.writeFile(wb, "TimesheetData.xlsx");

            sap.m.MessageToast.show("Excel file downloaded successfully!");
        }

    });
});
