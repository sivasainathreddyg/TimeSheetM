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
                    title: {
                        visible: true,
                        text: "Employees Leaves" // ✅ This should replace "Title of Chart"
                    },
                    valueAxis: {
                        title: {
                            visible: true
                        },
                        label: {
                            formatString: "L0" // Format to display whole numbers only
                        },
                        scale: {
                            fixedRange: true, // Prevents auto-scaling
                            minValue: 0,
                            maxValue: 5 // Set based on expected max leaves
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

            var oModel = this.getView().getModel();
            var aEmployees = oModel.getProperty("/employees");
        
            // **Reset Leave Count for all Employees**
            aEmployees.forEach(function (oEmp) {
                oEmp.leaveCount = 0;
            });
        
            // **Update Model & Refresh**
            oModel.setProperty("/employees", aEmployees);
            oModel.refresh(true); // Ensure UI updates
            this.updateChart();
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
        
        
        OnDownloaddata: async function () {
            try {
                var oEmployeeTable = this.getView().byId("employeeTable");
                var oTimesheetTable = this.getView().byId("timesheetTable");
                var oVizFrame = this.getView().byId("leaveChart"); // Chart reference
                var oYearComboBox = this.getView().byId("yearComboBox");
                var oMonthComboBox = this.getView().byId("monthComboBox");
        
                var sSelectedYear = oYearComboBox.getSelectedKey() || new Date().getFullYear();
                var sSelectedMonth = oMonthComboBox.getSelectedKey() || new Date().toLocaleString("default", { month: "long" });
        
                var aEmployeeRows = oEmployeeTable.getItems();
                var aTimesheetRows = oTimesheetTable.getItems();
                var aColumns = oTimesheetTable.getColumns();
        
                if (!aEmployeeRows.length || !aTimesheetRows.length) {
                    MessageToast.show("No data available to download.");
                    return;
                }
        
                // Initialize Workbook
                var workbook = new ExcelJS.Workbook();
                var worksheet = workbook.addWorksheet("Timesheet");
        
                var aHeaderRow = ["Name", "Client", "Project", "Client ID"];
                var aDates = [];
                var aWeekendColumns = [];
                var sSelectedYear = oYearComboBox.getSelectedKey() || new Date().getFullYear(); // Get selected year

                // Extract column headers dynamically
                for (var i = 1; i < aColumns.length; i++) {
                    
                    var sDateHeader = aColumns[i].getHeader().getText();
                    aHeaderRow.push(sDateHeader); 
                    aDates.push(sDateHeader);
                    var oDate = new Date(`${sSelectedYear} ${sDateHeader}`); 
                    if (oDate.getDay() === 6 || oDate.getDay() === 0) {
                        aWeekendColumns.push(sDateHeader); 
                    } 
                   
                }
                aHeaderRow.push("Total");
        
                // Add Title Row
                let titleRow = worksheet.addRow([`Timesheet - ${sSelectedMonth} ${sSelectedYear}`]);
                titleRow.getCell(1).font = { bold: true, size: 14 };
                worksheet.mergeCells("A1:" + String.fromCharCode(65 + aHeaderRow.length - 1) + "1");
        
                // Add Empty Row
                worksheet.addRow([]);
        
                // Add Header Row with Styling
                let headerRow = worksheet.addRow(aHeaderRow);
                headerRow.eachCell((cell, colNumber) => {
                    cell.font = { bold: true, color: { argb: "FFFFFF" } };
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4F81BD" } };
                    cell.alignment = { horizontal: "center" };
        
                });
                worksheet.eachRow((row, rowIndex) => {
                    row.eachCell((cell, colIndex) => {
                        let sColumnHeader = aHeaderRow[colIndex - 1]; // Get the column header
                
                        // If the column is a weekend, apply gray fill to the entire column
                        if (aWeekendColumns.includes(sColumnHeader)) {
                            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D3D3D3" } };
                        }
                    });
                });
        
                var aData = [];
        
                aTimesheetRows.forEach(function (oTimesheetRow, index) {
                    var aEmployeeCells = aEmployeeRows[index].getCells();
                    var aTimesheetCells = oTimesheetRow.getCells();
        
                    var aRowData = [
                        aEmployeeCells[0].getText(),
                        aEmployeeCells[1].getText(),
                        aEmployeeCells[2].getText(),
                        aEmployeeCells[3].getText()
                    ];
        
                    for (var j = 1; j < aTimesheetCells.length; j++) {
                        var oCell = aTimesheetCells[j];
                        var sCellValue = "";
        
                        if (oCell.getMetadata().getName() === "sap.m.Input") {
                            sCellValue = oCell.getValue();
                        } else if (oCell.getMetadata().getName() === "sap.m.Text") {
                            sCellValue = oCell.getText();
                        }
                        aRowData.push(sCellValue);
                    }
                    aData.push(aRowData);
                });
        
                // Add Data Rows
                aData.forEach((row) => {
                    let excelRow = worksheet.addRow(row);
                    excelRow.eachCell((cell) => {
                        cell.alignment = { horizontal: "center" };
                    });
                });
        
                // Convert Chart to Image and Insert into Excel
                if (oVizFrame) {
                    var sSVG = oVizFrame.exportToSVGString();
                    var canvas = document.createElement("canvas");
                    var ctx = canvas.getContext("2d");
                    var img = new Image();
                
                    img.onload = function () {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        var chartImage = canvas.toDataURL("image/png");
                
                        // 📌 **STEP 2: Insert Image into Excel Sheet**
                        var imageId = workbook.addImage({
                            base64: chartImage.split(",")[1], // Extract base64 data
                            extension: "png"
                        });
                
                        worksheet.addImage(imageId, {
                            tl: { col: 7, row: aData.length + 4 }, // Position below table
                            ext: { width: 500, height: 300 }
                        });
                
                        // 📌 **STEP 3: Save and Download Excel File**
                        workbook.xlsx.writeBuffer().then(function (buffer) {
                            var blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                            saveAs(blob, "Timesheet.xlsx");
                        });
                    };
                
                    img.src = "data:image/svg+xml;base64," + btoa(sSVG);
                } else {
                    // If no chart, just download the Excel file
                    workbook.xlsx.writeBuffer().then(function (buffer) {
                        var blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                        File.save(blob, "Timesheet.xlsx");
                    });
                }
                }  catch (error) {
                console.error("Error generating Excel:", error);
                MessageToast.show("Error generating Excel file.");
            }
        }
       

        
        
    });
});
