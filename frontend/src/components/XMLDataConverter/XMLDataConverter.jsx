import React, { useState } from 'react';
import "./XMLDataConverter.css"
import { SaxesParser, SaxesTagPlain } from 'saxes';



// const stripNS = (tagName) => {
//     return tagName.split(':').pop()?.toLowerCase() || '';
// }

const stripNS = (tagName) => {
    return tagName.split(':').pop() || '';
}

const XMLDataConverter = () => {
    const [status, setStatus] = useState('');
    const [file, setFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [progressError, setProgressError] = useState(false);

    //New Code
    const [activity, setActivity] = useState([]);
    const [resourceAssignment, setResourceAssignment] = useState([]);
    const [project, setProject] = useState([]);
    const [resource, setResource] = useState([]);
    const [wbsNew, setWbsNew] = useState([]);
    const [errorNew, setErrorNew] = useState(null);


    const [baselineProject, setBaselineProject] = useState([]);
    const [baselineActivity, setBaselineActivity] = useState([]);
    const [baselineResourceAssignment, setBaselineResourceAssignment] = useState([]);
    const [baselineResource, setBaselineResource] = useState([]);
    const [baselineWbs, setBaselineWbs] = useState([]);

    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date().toISOString().split('T')[0];
        return today;
    });


    const BATCH_SIZE = 500;

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setStatus('File selected. Ready to process.');
    };

    const parseBool = (val) => val === '1';

    const parseFloatOrNull = (val) => val ? parseFloat(val) : null;

    const parseIntOrNull = (val) => val ? parseInt(val) : null;

    const parseDateOrDefault = (val) =>
        val ? new Date(val).toISOString() : '2025-01-01T00:00:00Z';

    const formatDate = (val) => {
        if (!val) return null;
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    };

    const handleProcessFile = async () => {
        setProgress(1);
        if (!file) {
            setStatus('Please select a file first.');
            return;
        }
        setStatus('Reading file...');




        setActivity([]);
        setResourceAssignment([]);
        setProject([]);
        setResource([]);
        setWbsNew([]);
        setErrorNew(null);

        const activityArr = [];
        const raArr = [];
        const projectArr = [];
        const resourceArr = [];
        const wbsArr = [];

        const baselineProjectArr = [];
        const baselineWbsArr = [];
        const baselineResourceArr = [];
        const baselineRaArr = [];
        const baselineActivityArr = [];

        const stack = [];
        let currentText = '';
        let insideBaselineProject = false;

        const sxParser = new SaxesParser({ xmlns: false, lowercase: false })

        sxParser.on('opentag', (tag) => {
            const tagName = stripNS(tag.name);
            const tagNameLowerCase = tagName.toLowerCase();
            const obj = { ...tag.attributes, __tag: tagName };

            if (tagName === 'BaselineProject') {
                insideBaselineProject = true;
            }

            stack.push({ tagName, tagNameLowerCase, obj });
            currentText = '';
        })

        sxParser.on('text', (text) => { currentText += text; });
        sxParser.on('cdata', (data) => { currentText += data; });

        sxParser.on('closetag', (tag) => {

            const tagName = stripNS(tag.name);
            const tagNameLowerCase = tagName.toLowerCase()
            const { obj } = stack.pop();

            if (currentText.trim() === '' && tag.attributes?.['xsi:nil'] === 'true') {
                obj.text = null;
            }
            else if (currentText.trim()) {
                obj.text = currentText.trim();
            }
            currentText = '';


            if (tagName === 'BaselineProject') {
                baselineProjectArr.push(obj);
                insideBaselineProject = false;
                return;
            }

            if (['Activity', 'ResourceAssignment', 'Project', 'Resource', 'WBS'].includes(tagName)) {

                if (insideBaselineProject) {
                    switch (tagName) {
                        case 'Activity': baselineActivityArr.push(obj); break;
                        case 'ResourceAssignment': baselineRaArr.push(obj); break;
                        case 'Project': baselineProjectArr.push(obj); break;
                        case 'Resource': baselineResourceArr.push(obj); break;
                        case 'WBS': baselineWbsArr.push(obj); break;
                    }
                }
                else {
                    switch (tagName) {
                        case 'Activity': activityArr.push(obj); break;
                        case 'ResourceAssignment': raArr.push(obj); break;
                        case 'Project': projectArr.push(obj); break;
                        case 'Resource': resourceArr.push(obj); break;
                        case 'WBS': wbsArr.push(obj); break;
                        default: break;
                    }
                }

            }
            else if (stack.length) {
                const parent = stack[stack.length - 1].obj;
                const content = obj.text ?? obj;

                if (!parent[tagName]) {
                    parent[tagName] = content;
                }
                else if (Array.isArray(parent[tagName])) {
                    parent[tagName].push(content);
                }
                else {
                    parent[tagName] = [parent[tagName], content];
                }
            }
        })

        sxParser.on('error', (err) => {
            setStatus(`SAX parser error: ${err.message}`);
            sxParser.close();
        })

        try {

            const reader = file.stream().getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();

                // console.log("DONE, VALUE: ", { done, value });

                if (done) break;

                sxParser.write(decoder.decode(value, { stream: true }));
            }
            sxParser.close();

            if (
                activityArr.length === 0 &&
                raArr.length === 0 &&
                projectArr.length === 0 &&
                resourceArr.length === 0 &&
                wbsArr.length === 0
            ) {
                setErrorNew('Parsed XML has no usable Project data; check tag names/file format.');

            }

            if (
                baselineActivityArr.length === 0 &&
                baselineProjectArr.length === 0 &&
                baselineRaArr.length === 0 &&
                baselineResourceArr.length === 0 &&
                baselineWbsArr.length === 0
            ) {
                setErrorNew('Parsed XML has no usable Baseline project data; check tag names/file format.');
            }

            setActivity(activityArr);
            setResourceAssignment(raArr);
            setProject(projectArr);
            setResource(resourceArr);
            setWbsNew(wbsArr);

            setBaselineActivity(baselineActivityArr);
            setBaselineProject(baselineProjectArr);
            setBaselineResourceAssignment(baselineRaArr);
            setBaselineResource(baselineResourceArr)
            setBaselineWbs(baselineWbsArr)

            // console.log("Resource: ", resourceArr)
            // console.log("Project: ", projectArr)
            // console.log("WBS: ", wbsArr)
            // console.log("Activity: ", activityArr)
            // console.log("ResourceAss: ", raArr)

            // console.log("blResource: ", baselineResourceArr)
            // console.log("blProject: ", baselineProjectArr)
            // console.log("blWBS: ", baselineWbsArr)
            // console.log("blActivity: ", baselineActivityArr)
            // console.log("blResourceAss: ", baselineRaArr)

        } catch (error) {
            console.log("Error: ", error)
            setStatus(error?.message || 'Unknown error');
        }


        // return;



        setProgress(20);

        const textVal = (v) => {
            if (v == null) return null;
            if (Array.isArray(v)) return textVal(v[0]);
            if (typeof v === 'object') {
                if ('text' in v) return v.text;
                return ''; // Self-closing or empty object → treat as empty string
            }
            return v; // already primitive
        };

        // ========== 1. Parse Resource Nodes ==========
        // const resourceNodes = xmlDoc.getElementsByTagName('Resource');
        const resources = resourceArr.map((node) => ({
            objectId: parseIntOrNull(textVal(node.ObjectId)),
            autoComputeActuals: parseBool(textVal(node.AutoComputeActuals)),
            calculateCostFromUnits: parseBool(textVal(node.CalculateCostFromUnits)),
            calendarObjectId: parseIntOrNull(textVal(node.CalendarObjectId)),
            currencyObjectId: parseIntOrNull(textVal(node.CurrencyObjectId)),
            defaultUnitsPerTime: parseFloatOrNull(textVal(node.DefaultUnitsPerTime)),
            emailAddress: textVal(node.EmailAddress) || null,
            employeeId: textVal(node.EmployeeId) || null,
            guid: textVal(node.GUID) || null,
            id: textVal(node.Id) || null,
            isActive: parseBool(textVal(node.IsActive)),
            isOverTimeAllowed: parseBool(textVal(node.IsOverTimeAllowed)),
            name: textVal(node.Name) || null,
            officePhone: textVal(node.OfficePhone) || null,
            otherPhone: textVal(node.OtherPhone) || null,
            overtimeFactor: parseFloatOrNull(textVal(node.OvertimeFactor)),
            parentObjectId: parseIntOrNull(textVal(node.ParentObjectId)),
            primaryRoleObjectId: parseIntOrNull(textVal(node.PrimaryRoleObjectId)),
            resourceNotes: textVal(node.ResourceNotes) || null,
            resourceType: textVal(node.ResourceType) || null,
            sequenceNumber: parseIntOrNull(textVal(node.SequenceNumber)),
            shiftObjectId: parseIntOrNull(textVal(node.ShiftObjectId)),
            timesheetApprMngrObjectId: parseIntOrNull(textVal(node.TimesheetApprovalManagerObjectId)),
            title: textVal(node.Title) || null,
            unitOfMeasureObjectId: parseIntOrNull(textVal(node.UnitOfMeasureObjectId)),
            uploadDate: selectedDate,                    // keep your chosen date
            useTimesheets: parseBool(textVal(node.UseTimesheets)),
            userObjectId: parseIntOrNull(textVal(node.UserObjectId)),
        }));

        // setProgress(12);

        // ========== 2. Parse Project Nodes ==========
        const projects = projectArr.map((node) => ({
            objectId: parseIntOrNull(textVal(node.ObjectId)),
            wbsObjectId: parseIntOrNull(textVal(node.WBSObjectId)),
            actDefCalendarObjectId: parseIntOrNull(textVal(node.ActivityDefaultCalendarObjectId)),
            actDefCostAccountObjectId: parseIntOrNull(textVal(node.ActivityDefaultCostAccountObjectId)),
            actDefPercentCompleteType: textVal(node.ActivityDefaultPercentCompleteType) || "",
            actDefaultPricePerUnit: parseFloatOrNull(textVal(node.ActivityDefaultPricePerUnit)),
            actIdBasedOnSelectedAct: parseBool(textVal(node.ActivityIdBasedOnSelectedActivity)),
            actPerComplBaseOnActStep: parseBool(textVal(node.ActivityPercentCompleteBasedOnActivitySteps)),
            activityDefaultActivityType: textVal(node.ActivityDefaultActivityType) || "",
            activityDefaultDurationType: textVal(node.ActivityDefaultDurationType) || "",
            activityIdIncrement: parseIntOrNull(textVal(node.ActivityIdIncrement)),
            activityIdPrefix: textVal(node.ActivityIdPrefix) || "",
            activityIdSuffix: textVal(node.ActivityIdSuffix) || "",
            addActualToRemaining: parseBool(textVal(node.AddActualToRemaining)),
            addedBy: textVal(node.AddedBy) || "",
            allowNegActualUnitsFlag: parseBool(textVal(node.AllowNegativeActualUnitsFlag)),
            allowStatusReview: parseBool(textVal(node.AllowStatusReview)),
            annualDiscountRate: parseFloatOrNull(textVal(node.AnnualDiscountRate)),
            anticipatedFinishDate: formatDate(textVal(node.AnticipatedFinishDate)),
            anticipatedStartDate: formatDate(textVal(node.AnticipatedStartDate)),
            assigDefaultDrivingFlag: parseBool(textVal(node.AssignmentDefaultDrivingFlag)),
            assignmentDefaultRateType: textVal(node.AssignmentDefaultRateType) || "",
            checkOutStatus: parseBool(textVal(node.CheckOutStatus)),
            costQuantityRecalculateFlag: parseBool(textVal(node.CostQuantityRecalculateFlag)),
            criticalActivityFloatLimit: parseIntOrNull(textVal(node.CriticalActivityFloatLimit)),
            criticalActivityPathType: textVal(node.CriticalActivityPathType) || "",
            currBLProjectObjectId: parseIntOrNull(textVal(node.CurrentBaselineProjectObjectId)),
            dataDate: formatDate(textVal(node.DataDate)),
            dateAdded: formatDate(textVal(node.DateAdded)),
            defaultPriceTimeUnits: textVal(node.DefaultPriceTimeUnits) || "",
            discountApplicationPeriod: textVal(node.DiscountApplicationPeriod) || "",
            earnedValueComputeType: textVal(node.EarnedValueComputeType) || "",
            earnedValueETCComputeType: textVal(node.EarnedValueETCComputeType) || "",
            earnedValueETCUserValue: parseFloatOrNull(textVal(node.EarnedValueETCUserValue)),
            earnedValueUserPercent: parseFloatOrNull(textVal(node.EarnedValueUserPercent)),
            enableSummarization: parseBool(textVal(node.EnableSummarization)),
            financialPeriodTemplateId: parseIntOrNull(textVal(node.FinancialPeriodTemplateId)),
            fiscalYearStartMonth: parseIntOrNull(textVal(node.FiscalYearStartMonth)),
            guid: textVal(node.GUID) || "00000000-0000-0000-0000-000000000000",
            id: textVal(node.Id) || "",
            independentETCLaborUnits: parseFloatOrNull(textVal(node.IndependentETCLaborUnits)),
            independentETCTotalCost: parseFloatOrNull(textVal(node.IndependentETCTotalCost)),
            lastFinPeriodObjectId: parseIntOrNull(textVal(node.LastFinancialPeriodObjectId)),
            levelingPriority: parseIntOrNull(textVal(node.LevelingPriority)),
            linkActualToActThisPeriod: parseBool(textVal(node.LinkActualToActualThisPeriod)),
            linkPerCompleteWithActual: parseBool(textVal(node.LinkPercentCompleteWithActual)),
            linkPlannedAndAtComplFlag: parseBool(textVal(node.LinkPlannedAndAtCompletionFlag)),
            mustFinishByDate: formatDate(textVal(node.MustFinishByDate)),
            name: textVal(node.Name) || "",
            obsObjectId: parseIntOrNull(textVal(node.OBSObjectId)),
            originalBudget: parseFloatOrNull(textVal(node.OriginalBudget)),
            parentEPSObjectId: parseIntOrNull(textVal(node.ParentEPSObjectId)),
            plannedStartDate: formatDate(textVal(node.PlannedStartDate)),
            primResCanMarkActAsCompl: parseBool(textVal(node.PrimaryResourcesCanMarkActivitiesAsCompleted)),
            projectForecastStartDate: formatDate(textVal(node.ProjectForecastStartDate)),
            resCanAssignThemselToAct: parseBool(textVal(node.ResourcesCanAssignThemselvesToActivities)),
            resCanBeAssToSameActMoreOnce: parseBool(textVal(node.ResourceCanBeAssignedToSameActivityMoreThanOnce)),
            resetPlannToRemainingFlag: parseBool(textVal(node.ResetPlannedToRemainingFlag)),
            scheduledFinishDate: formatDate(textVal(node.ScheduledFinishDate)),
            status: textVal(node.Status) || "",
            strategicPriority: parseIntOrNull(textVal(node.StrategicPriority)),
            summarizeToWBSLevel: parseIntOrNull(textVal(node.SummarizeToWBSLevel)),
            summaryLevel: parseIntOrNull(textVal(node.SummaryLevel)),
            uploadDate: selectedDate,
            useProjBLForEarnedValue: parseBool(textVal(node.UseProjectBaselineForEarnedValue)),
            wbsCodeSeparator: textVal(node.WBSCodeSeparator) || "",
            webSiteRootDirectory: textVal(node.WebSiteRootDirectory) || "",
            webSiteURL: textVal(node.WebSiteURL) || "",
        }));

        // setProgress(13);

        // ========== 3. Parse WBS Nodes ==========

        const wbs = wbsArr.map((node) => ({
            projectObjectId: parseIntOrNull(textVal(node.ProjectObjectId)),
            objectId: parseIntOrNull(textVal(node.ObjectId)),
            parentObjectId: parseIntOrNull(textVal(node.ParentObjectId)),
            anticipatedFinishDate: formatDate(textVal(node.AnticipatedFinishDate)),
            anticipatedStartDate: formatDate(textVal(node.AnticipatedStartDate)),
            code: textVal(node.Code) || "",
            earnedValueComputeType: textVal(node.EarnedValueComputeType) || "",
            earnedValueETCComputeType: textVal(node.EarnedValueETCComputeType) || "",
            earnedValueETCUserValue: parseFloatOrNull(textVal(node.EarnedValueETCUserValue)),
            earnedValueUserPercent: parseFloatOrNull(textVal(node.EarnedValueUserPercent)),
            independentETCLaborUnits: parseFloatOrNull(textVal(node.IndependentETCLaborUnits)),
            independentETCTotalCost: parseFloatOrNull(textVal(node.IndependentETCTotalCost)),
            name: textVal(node.Name) || "",
            obsObjectId: parseIntOrNull(textVal(node.OBSObjectId)),
            originalBudget: parseFloatOrNull(textVal(node.OriginalBudget)),
            sequenceNumber: parseIntOrNull(textVal(node.SequenceNumber)),
            status: textVal(node.Status) || "",
            uploadDate: selectedDate,
            wbsCategoryObjectId: parseIntOrNull(textVal(node.WBSCategoryObjectId)),
        }));

        // setProgress(15);


        // ========== 4. Parse Activity Nodes ==========
        const activityItems = activityArr.map((node) => {
            const udf = node.UDF || {};
            const code = node.Code || [];

            // -- local helper lives only for this node ---------------------------
            const getCode = (idx, key) =>
                parseIntOrNull(textVal(code[idx]?.[key]));

            return {
                objectId: parseIntOrNull(textVal(node.ObjectId)),
                guid: (textVal(node.GUID) || "").replace(/[{}]/g, ""),
                id: textVal(node.Id) || "",
                name: textVal(node.Name) || "",
                status: textVal(node.Status) || "",
                type: textVal(node.Type) || "",
                calendarObjectId: parseIntOrNull(textVal(node.CalendarObjectId)),
                projectObjectId: parseIntOrNull(textVal(node.ProjectObjectId)),
                wbsObjectId: parseIntOrNull(textVal(node.WBSObjectId)),
                startDate: parseDateOrDefault(textVal(node.StartDate)),
                finishDate: parseDateOrDefault(textVal(node.FinishDate)),
                plannedStartDate: parseDateOrDefault(textVal(node.PlannedStartDate)),
                plannedFinishDate: parseDateOrDefault(textVal(node.PlannedFinishDate)),
                remainingEarlyStartDate: parseDateOrDefault(textVal(node.RemainingEarlyStartDate)),
                remainingEarlyFinishDate: parseDateOrDefault(textVal(node.RemainingEarlyFinishDate)),
                remainingLateStartDate: parseDateOrDefault(textVal(node.RemainingLateStartDate)),
                remainingLateFinishDate: parseDateOrDefault(textVal(node.RemainingLateFinishDate)),
                actualStartDate: parseDateOrDefault(textVal(node.ActualStartDate)),
                actualFinishDate: parseDateOrDefault(textVal(node.ActualFinishDate)),
                expectedFinishDate: parseDateOrDefault(textVal(node.ExpectedFinishDate)),
                primaryConstraintDate: parseDateOrDefault(textVal(node.PrimaryConstraintDate)),
                secondaryConstraintDate: parseDateOrDefault(textVal(node.SecondaryConstraintDate)),
                suspendDate: parseDateOrDefault(textVal(node.SuspendDate)),
                resumeDate: parseDateOrDefault(textVal(node.ResumeDate)),
                durationType: textVal(node.DurationType) || "",
                primaryConstraintType: textVal(node.PrimaryConstraintType) || "",
                secondaryConstraintType: textVal(node.SecondaryConstraintType) || "",
                percentCompleteType: textVal(node.PercentCompleteType) || "",
                levelingPriority: textVal(node.LevelingPriority) || "",
                notesToResources: textVal(node.NotesToResources) || "",
                feedback: textVal(node.Feedback) || "",
                isNewFeedback: parseBool(textVal(node.IsNewFeedback)),
                reviewRequired: parseBool(textVal(node.ReviewRequired)),
                autoComputeActuals: parseBool(textVal(node.AutoComputeActuals)),
                estimatedWeight: parseFloatOrNull(textVal(node.EstimatedWeight)),
                durationPercentComplete: parseFloatOrNull(textVal(node.DurationPercentComplete)),
                scopePercentComplete: parseFloatOrNull(textVal(node.ScopePercentComplete)),
                unitsPercentComplete: parseFloatOrNull(textVal(node.UnitsPercentComplete)),
                nonLaborUnitsPerComplete: parseFloatOrNull(textVal(node.NonLaborUnitsPercentComplete)),
                percentComplete: parseFloatOrNull(textVal(node.PercentComplete)),
                physicalPercentComplete: parseFloatOrNull(textVal(node.PhysicalPercentComplete)),
                actualDuration: parseFloatOrNull(textVal(node.ActualDuration)),
                plannedDuration: parseFloatOrNull(textVal(node.PlannedDuration)),
                remainingDuration: parseFloatOrNull(textVal(node.RemainingDuration)),
                atCompletionDuration: parseFloatOrNull(textVal(node.AtCompletionDuration)),
                plannedLaborUnits: parseFloatOrNull(textVal(node.PlannedLaborUnits)),
                remainingLaborUnits: parseFloatOrNull(textVal(node.RemainingLaborUnits)),
                atCompletionLaborUnits: parseFloatOrNull(textVal(node.AtCompletionLaborUnits)),
                actualLaborUnits: parseFloatOrNull(textVal(node.ActualLaborUnits)),
                actualThisPeriodLaborUnits: parseFloatOrNull(textVal(node.ActualThisPeriodLaborUnits)),
                plannedNonLaborUnits: parseFloatOrNull(textVal(node.PlannedNonLaborUnits)),
                remainingNonLaborUnits: parseFloatOrNull(textVal(node.RemainingNonLaborUnits)),
                atCompletionNonLaborUnits: parseFloatOrNull(textVal(node.AtCompletionNonLaborUnits)),
                actualNonLaborUnits: parseFloatOrNull(textVal(node.ActualNonLaborUnits)),
                actThisPeriodNonLaborUnits: parseFloatOrNull(textVal(node.ActualThisPeriodNonLaborUnits)),
                plannedLaborCost: parseFloatOrNull(textVal(node.PlannedLaborCost)),
                remainingLaborCost: parseFloatOrNull(textVal(node.RemainingLaborCost)),
                atCompletionLaborCost: parseFloatOrNull(textVal(node.AtCompletionLaborCost)),
                actualLaborCost: parseFloatOrNull(textVal(node.ActualLaborCost)),
                actualThisPeriodLaborCost: parseFloatOrNull(textVal(node.ActualThisPeriodLaborCost)),
                plannedNonLaborCost: parseFloatOrNull(textVal(node.PlannedNonLaborCost)),
                remainingNonLaborCost: parseFloatOrNull(textVal(node.RemainingNonLaborCost)),
                atCompletionNonLaborCost: parseFloatOrNull(textVal(node.AtCompletionNonLaborCost)),
                actualNonLaborCost: parseFloatOrNull(textVal(node.ActualNonLaborCost)),
                actThisPeriodNonLaborCost: parseFloatOrNull(textVal(node.ActualThisPeriodNonLaborCost)),
                atCompletionExpenseCost: parseFloatOrNull(textVal(node.AtCompletionExpenseCost)),
                primaryResourceObjectId: parseIntOrNull(textVal(node.PrimaryResourceObjectId)),

                udfTypeObjectId: parseIntOrNull(textVal(udf.TypeObjectId)),
                udfTextValue: textVal(udf.TextValue) || "",

                // Codes 1–9 using inline helper
                codeTypeObjectId1: getCode(0, 'TypeObjectId'),
                codeValueObjectId1: getCode(0, 'ValueObjectId'),
                codeTypeObjectId2: getCode(1, 'TypeObjectId'),
                codeValueObjectId2: getCode(1, 'ValueObjectId'),
                codeTypeObjectId3: getCode(2, 'TypeObjectId'),
                codeValueObjectId3: getCode(2, 'ValueObjectId'),
                codeTypeObjectId4: getCode(3, 'TypeObjectId'),
                codeValueObjectId4: getCode(3, 'ValueObjectId'),
                codeTypeObjectId5: getCode(4, 'TypeObjectId'),
                codeValueObjectId5: getCode(4, 'ValueObjectId'),
                codeTypeObjectId6: getCode(5, 'TypeObjectId'),
                codeValueObjectId6: getCode(5, 'ValueObjectId'),
                codeTypeObjectId7: getCode(6, 'TypeObjectId'),
                codeValueObjectId7: getCode(6, 'ValueObjectId'),
                codeTypeObjectId8: getCode(7, 'TypeObjectId'),
                codeValueObjectId8: getCode(7, 'ValueObjectId'),
                codeTypeObjectId9: getCode(8, 'TypeObjectId'),
                codeValueObjectId9: getCode(8, 'ValueObjectId'),

                uploadDate: selectedDate
            };
        });

        // setProgress(17);

        // ========== 5. Parse Resource Assignment Nodes ==========
        const resourceAssignmentItems = raArr.map((node) => ({
            objectId: parseIntOrNull(textVal(node.ObjectId)),
            guid: (textVal(node.GUID) || "").replace(/[{}]/g, ""),
            projectObjectId: parseIntOrNull(textVal(node.ProjectObjectId)),
            wbsObjectId: parseIntOrNull(textVal(node.WBSObjectId)),
            resourceObjectId: parseIntOrNull(textVal(node.ResourceObjectId)),
            activityObjectId: parseIntOrNull(textVal(node.ActivityObjectId)),
            costAccountObjectId: parseIntOrNull(textVal(node.CostAccountObjectId)),
            resourceCurveObjectId: parseIntOrNull(textVal(node.ResourceCurveObjectId)),
            roleObjectId: parseIntOrNull(textVal(node.RoleObjectId)),

            actualCost: parseFloatOrNull(textVal(node.ActualCost)),
            actualCurve: textVal(node.ActualCurve) || "",
            actualFinishDate: parseDateOrDefault(textVal(node.ActualFinishDate)),
            actualOvertimeCost: parseFloatOrNull(textVal(node.ActualOvertimeCost)),
            actualOvertimeUnits: parseFloatOrNull(textVal(node.ActualOvertimeUnits)),
            actualRegularCost: parseFloatOrNull(textVal(node.ActualRegularCost)),
            actualRegularUnits: parseFloatOrNull(textVal(node.ActualRegularUnits)),
            actualStartDate: parseDateOrDefault(textVal(node.ActualStartDate)),
            actualThisPeriodCost: parseFloatOrNull(textVal(node.ActualThisPeriodCost)),
            actualThisPeriodUnits: parseFloatOrNull(textVal(node.ActualThisPeriodUnits)),
            actualUnits: parseFloatOrNull(textVal(node.ActualUnits)),

            atCompletionCost: parseFloatOrNull(textVal(node.AtCompletionCost)),
            atCompletionUnits: parseFloatOrNull(textVal(node.AtCompletionUnits)),

            drivingActivityDatesFlag: parseBool(textVal(node.DrivingActivityDatesFlag)),
            isCostUnitsLinked: parseBool(textVal(node.IsCostUnitsLinked)),
            isPrimaryResource: parseBool(textVal(node.IsPrimaryResource)),

            finishDate: parseDateOrDefault(textVal(node.FinishDate)),
            startDate: parseDateOrDefault(textVal(node.StartDate)),

            plannedCost: parseFloatOrNull(textVal(node.PlannedCost)),
            plannedCurve: textVal(node.PlannedCurve) || "",
            plannedFinishDate: parseDateOrDefault(textVal(node.PlannedFinishDate)),
            plannedLag: parseIntOrNull(textVal(node.PlannedLag)),
            plannedStartDate: parseDateOrDefault(textVal(node.PlannedStartDate)),
            plannedUnits: parseFloatOrNull(textVal(node.PlannedUnits)),
            plannedUnitsPerTime: parseFloatOrNull(textVal(node.PlannedUnitsPerTime)),

            remainingCost: parseFloatOrNull(textVal(node.RemainingCost)),
            remainingCurve: textVal(node.RemainingCurve) || "",
            remainingDuration: parseFloatOrNull(textVal(node.RemainingDuration)),
            remainingFinishDate: parseDateOrDefault(textVal(node.RemainingFinishDate)),
            remainingLag: parseIntOrNull(textVal(node.RemainingLag)),
            remainingStartDate: parseDateOrDefault(textVal(node.RemainingStartDate)),
            remainingUnits: parseFloatOrNull(textVal(node.RemainingUnits)),
            remainingUnitsPerTime: parseFloatOrNull(textVal(node.RemainingUnitsPerTime)),

            overtimeFactor: parseFloatOrNull(textVal(node.OvertimeFactor)),
            pricePerUnit: parseFloatOrNull(textVal(node.PricePerUnit)),

            proficiency: textVal(node.Proficiency) || "",
            rateSource: textVal(node.RateSource) || "",
            rateType: textVal(node.RateType) || "",

            unitsPercentComplete: parseFloatOrNull(textVal(node.UnitsPercentComplete)),

            resourceType: textVal(node.ResourceType) || "",
            uploadDate: selectedDate,
        }));


        const baselineActivityItems = baselineActivityArr.map((node) => {
            const udf = node.UDF || {};
            const code = node.Code || [];

            const getCode = (idx, key) =>
                parseIntOrNull(textVal(code[idx]?.[key]));

            return {
                objectId: parseIntOrNull(textVal(node.ObjectId)),
                guid: (textVal(node.GUID) || "").replace(/[{}]/g, ""),
                id: textVal(node.Id) || "",
                name: textVal(node.Name) || "",
                status: textVal(node.Status) || "",
                type: textVal(node.Type) || "",
                calendarObjectId: parseIntOrNull(textVal(node.CalendarObjectId)),
                projectObjectId: parseIntOrNull(textVal(node.ProjectObjectId)),
                wbsObjectId: parseIntOrNull(textVal(node.WBSObjectId)),
                startDate: parseDateOrDefault(textVal(node.StartDate)),
                finishDate: parseDateOrDefault(textVal(node.FinishDate)),
                plannedStartDate: parseDateOrDefault(textVal(node.PlannedStartDate)),
                plannedFinishDate: parseDateOrDefault(textVal(node.PlannedFinishDate)),
                remainingEarlyStartDate: parseDateOrDefault(textVal(node.RemainingEarlyStartDate)),
                remainingEarlyFinishDate: parseDateOrDefault(textVal(node.RemainingEarlyFinishDate)),
                remainingLateStartDate: parseDateOrDefault(textVal(node.RemainingLateStartDate)),
                remainingLateFinishDate: parseDateOrDefault(textVal(node.RemainingLateFinishDate)),
                actualStartDate: parseDateOrDefault(textVal(node.ActualStartDate)),
                actualFinishDate: parseDateOrDefault(textVal(node.ActualFinishDate)),
                expectedFinishDate: parseDateOrDefault(textVal(node.ExpectedFinishDate)),
                primaryConstraintDate: parseDateOrDefault(textVal(node.PrimaryConstraintDate)),
                secondaryConstraintDate: parseDateOrDefault(textVal(node.SecondaryConstraintDate)),
                suspendDate: parseDateOrDefault(textVal(node.SuspendDate)),
                resumeDate: parseDateOrDefault(textVal(node.ResumeDate)),
                durationType: textVal(node.DurationType) || "",
                primaryConstraintType: textVal(node.PrimaryConstraintType) || "",
                secondaryConstraintType: textVal(node.SecondaryConstraintType) || "",
                percentCompleteType: textVal(node.PercentCompleteType) || "",
                levelingPriority: textVal(node.LevelingPriority) || "",
                notesToResources: textVal(node.NotesToResources) || "",
                feedback: textVal(node.Feedback) || "",
                isNewFeedback: parseBool(textVal(node.IsNewFeedback)),
                reviewRequired: parseBool(textVal(node.ReviewRequired)),
                autoComputeActuals: parseBool(textVal(node.AutoComputeActuals)),
                estimatedWeight: parseFloatOrNull(textVal(node.EstimatedWeight)),
                durationPercentComplete: parseFloatOrNull(textVal(node.DurationPercentComplete)),
                scopePercentComplete: parseFloatOrNull(textVal(node.ScopePercentComplete)),
                unitsPercentComplete: parseFloatOrNull(textVal(node.UnitsPercentComplete)),
                nonLaborUnitsPerComplete: parseFloatOrNull(textVal(node.NonLaborUnitsPercentComplete)),
                percentComplete: parseFloatOrNull(textVal(node.PercentComplete)),
                physicalPercentComplete: parseFloatOrNull(textVal(node.PhysicalPercentComplete)),
                actualDuration: parseFloatOrNull(textVal(node.ActualDuration)),
                plannedDuration: parseFloatOrNull(textVal(node.PlannedDuration)),
                remainingDuration: parseFloatOrNull(textVal(node.RemainingDuration)),
                atCompletionDuration: parseFloatOrNull(textVal(node.AtCompletionDuration)),
                plannedLaborUnits: parseFloatOrNull(textVal(node.PlannedLaborUnits)),
                remainingLaborUnits: parseFloatOrNull(textVal(node.RemainingLaborUnits)),
                atCompletionLaborUnits: parseFloatOrNull(textVal(node.AtCompletionLaborUnits)),
                actualLaborUnits: parseFloatOrNull(textVal(node.ActualLaborUnits)),
                actualThisPeriodLaborUnits: parseFloatOrNull(textVal(node.ActualThisPeriodLaborUnits)),
                plannedNonLaborUnits: parseFloatOrNull(textVal(node.PlannedNonLaborUnits)),
                remainingNonLaborUnits: parseFloatOrNull(textVal(node.RemainingNonLaborUnits)),
                atCompletionNonLaborUnits: parseFloatOrNull(textVal(node.AtCompletionNonLaborUnits)),
                actualNonLaborUnits: parseFloatOrNull(textVal(node.ActualNonLaborUnits)),
                actThisPeriodNonLaborUnits: parseFloatOrNull(textVal(node.ActualThisPeriodNonLaborUnits)),
                plannedLaborCost: parseFloatOrNull(textVal(node.PlannedLaborCost)),
                remainingLaborCost: parseFloatOrNull(textVal(node.RemainingLaborCost)),
                atCompletionLaborCost: parseFloatOrNull(textVal(node.AtCompletionLaborCost)),
                actualLaborCost: parseFloatOrNull(textVal(node.ActualLaborCost)),
                actualThisPeriodLaborCost: parseFloatOrNull(textVal(node.ActualThisPeriodLaborCost)),
                plannedNonLaborCost: parseFloatOrNull(textVal(node.PlannedNonLaborCost)),
                remainingNonLaborCost: parseFloatOrNull(textVal(node.RemainingNonLaborCost)),
                atCompletionNonLaborCost: parseFloatOrNull(textVal(node.AtCompletionNonLaborCost)),
                actualNonLaborCost: parseFloatOrNull(textVal(node.ActualNonLaborCost)),
                actThisPeriodNonLaborCost: parseFloatOrNull(textVal(node.ActualThisPeriodNonLaborCost)),
                atCompletionExpenseCost: parseFloatOrNull(textVal(node.AtCompletionExpenseCost)),
                primaryResourceObjectId: parseIntOrNull(textVal(node.PrimaryResourceObjectId)),

                udfTypeObjectId: parseIntOrNull(textVal(udf.TypeObjectId)),
                udfTextValue: textVal(udf.TextValue) || "",

                // Codes 1–9 using inline helper
                codeTypeObjectId1: getCode(0, 'TypeObjectId'),
                codeValueObjectId1: getCode(0, 'ValueObjectId'),
                codeTypeObjectId2: getCode(1, 'TypeObjectId'),
                codeValueObjectId2: getCode(1, 'ValueObjectId'),
                codeTypeObjectId3: getCode(2, 'TypeObjectId'),
                codeValueObjectId3: getCode(2, 'ValueObjectId'),
                codeTypeObjectId4: getCode(3, 'TypeObjectId'),
                codeValueObjectId4: getCode(3, 'ValueObjectId'),
                codeTypeObjectId5: getCode(4, 'TypeObjectId'),
                codeValueObjectId5: getCode(4, 'ValueObjectId'),
                codeTypeObjectId6: getCode(5, 'TypeObjectId'),
                codeValueObjectId6: getCode(5, 'ValueObjectId'),
                codeTypeObjectId7: getCode(6, 'TypeObjectId'),
                codeValueObjectId7: getCode(6, 'ValueObjectId'),
                codeTypeObjectId8: getCode(7, 'TypeObjectId'),
                codeValueObjectId8: getCode(7, 'ValueObjectId'),
                codeTypeObjectId9: getCode(8, 'TypeObjectId'),
                codeValueObjectId9: getCode(8, 'ValueObjectId'),

                uploadDate: selectedDate
            };
        });

        // setProgress(20);

        console.log("Resources: ", resources)
        console.log("Projects: ", projects)
        console.log("WBS: ", wbs)
        console.log("Activity: ", activityItems)
        console.log("ResourceAssignment: ", resourceAssignmentItems)
        console.log("BaselineResourceAssignments: ", baselineActivityItems)




        const totalItems = resources.length + projects.length + wbs.length + activityItems.length + resourceAssignmentItems.length + baselineActivityItems.length;

        let processedItems = 0;



        setStatus('Fetching access token...');
        let token;
        try {
            // const res = await fetch('https://xml-data-extraction-backend.onrender.com/getToken');
            const res = await fetch('https://xml2bc-dev-uat-new-backend.onrender.com/getToken');
            // const res = await fetch('http://localhost:3001/getToken')
            const data = await res.json();
            token = data.access_token;
            console.log("token: ", token)
        } catch (error) {
            setStatus('Failed to fetch access token.');
            return;
        }

        // ========== 1. Send Resource Data ==========
        setStatus('Processing Resources data...');
        // const resourceEndpoint = 'https://api.businesscentral.dynamics.com/v2.0/50b7a7db-965b-4a2e-8f58-39e635bf39b5/DEVUAT/api/alletec/primavera/v2.0/companies(f08e82f1-72e8-ef11-9345-6045bd14c5d0)/p6resources';
        const resourceEndpoint = 'https://api.businesscentral.dynamics.com/v2.0/50b7a7db-965b-4a2e-8f58-39e635bf39b5/Dev/api/alletec/primavera/v2.0/companies(9f813277-f624-f011-9af7-002248cb4a4f)/p6resources';


        try {

            let resourceBatchCount = 0;
            const resourceBatch = Math.ceil(resources.length / BATCH_SIZE)

            for (let i = 0; i < resources.length; i += BATCH_SIZE) {
                const resourceArray = resources.slice(i, i + BATCH_SIZE);
                console.log(`resourceArray:  `, resourceArray)

                const resourceObject = {
                    "primaryKey": "",
                    "resources": resourceArray
                };

                const resourceResponse = await fetch(resourceEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(resourceObject)
                })
                if (!resourceResponse.ok) throw new Error(`Resource error: ${await resourceResponse.text()}`);

                processedItems += resourceArray.length;
                resourceBatchCount++;

                const isLastBatch = resourceBatchCount === resourceBatch;

                if (resourceBatchCount % 1 === 0 || isLastBatch) {
                    const tempProgress = 20 + Math.round((processedItems / totalItems) * 80);
                    setProgress(tempProgress);
                }
            }
        } catch (err) {
            setStatus(`Error processing Resource data: ${err.message}`);
            setProgressError(true);
            return;
        }


        // ========== 2. Send Project Data ==========


        setStatus('Processing Projects data...');
        // const projectEndpoint = 'https://api.businesscentral.dynamics.com/v2.0/50b7a7db-965b-4a2e-8f58-39e635bf39b5/DEVUAT/api/alletec/primavera/v2.0/companies(f08e82f1-72e8-ef11-9345-6045bd14c5d0)/projects';
        const projectEndpoint = 'https://api.businesscentral.dynamics.com/v2.0/50b7a7db-965b-4a2e-8f58-39e635bf39b5/Dev/api/alletec/primavera/v2.0/companies(9f813277-f624-f011-9af7-002248cb4a4f)/projects';


        try {

            // const projectBatch = Math.ceil(projects.length / BATCH_SIZE);

            for (const project of projects) {
                console.log('Sending project to BC:', JSON.stringify(project, null, 2));

                const response = await fetch(projectEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(project),
                });
                if (!response.ok) throw new Error(`Project error: ${await response.text()}`);
            }
        } catch (err) {
            setStatus(`Error processing Project data: ${err.message}`);
            setProgressError(true);
            return;
        }

        processedItems++;


        // ========== 3. Send WBS Data ==========
        setStatus('Processing WBS data...');
        // const wbsEndpoints = 'https://api.businesscentral.dynamics.com/v2.0/50b7a7db-965b-4a2e-8f58-39e635bf39b5/DEVUAT/api/alletec/primavera/v2.0/companies(f08e82f1-72e8-ef11-9345-6045bd14c5d0)/p6wbsstagingroots';
        const wbsEndpoints = 'https://api.businesscentral.dynamics.com/v2.0/50b7a7db-965b-4a2e-8f58-39e635bf39b5/Dev/api/alletec/primavera/v2.0/companies(9f813277-f624-f011-9af7-002248cb4a4f)/p6wbsstagingroots';


        try {

            let wbsBatchCount = 0;
            const wbsBatch = Math.ceil(wbs.length / BATCH_SIZE);

            for (let i = 0; i < wbs.length; i += BATCH_SIZE) {
                const batchIdx = i / BATCH_SIZE;
                const wbsArray = wbs.slice(i, i + BATCH_SIZE);
                console.log(`wbsArray:  `, wbsArray)

                const wbsObject = {
                    "primaryKey": "",
                    "wbss": wbsArray
                };

                const wbsResponse = await fetch(wbsEndpoints, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(wbsObject)
                })
                if (!wbsResponse.ok) throw new Error(`WBS error: ${await wbsResponse.text()}`);

                processedItems += wbsArray.length;
                wbsBatchCount++;

                const isLastBatch = wbsBatchCount === wbsBatch;

                if (wbsBatchCount % 2 === 0 || isLastBatch) {
                    const tempProgress = 20 + Math.round((processedItems / totalItems) * 80);
                    setProgress(tempProgress);
                }

            }
        } catch (err) {
            setStatus(`Error processing WBS data: ${err.message}`);
            setProgressError(true);
            return;
        }



        // ========== 4. Send Activity Data ==========

        setStatus('Processing Activities data...');
        // const activityEndpoints = 'https://api.businesscentral.dynamics.com/v2.0/50b7a7db-965b-4a2e-8f58-39e635bf39b5/DEVUAT/api/alletec/primavera/v2.0/companies(f08e82f1-72e8-ef11-9345-6045bd14c5d0)/p6activityroots';
        const activityEndpoints = 'https://api.businesscentral.dynamics.com/v2.0/50b7a7db-965b-4a2e-8f58-39e635bf39b5/Dev/api/alletec/primavera/v2.0/companies(9f813277-f624-f011-9af7-002248cb4a4f)/p6activityroots';



        try {

            let activityBatchCount = 0;
            const activityBatch = Math.ceil( (activityItems.length + baselineActivityItems.length) / BATCH_SIZE);

            for (let i = 0; i < activityItems.length; i += BATCH_SIZE) {
                const batchIdx = i / BATCH_SIZE;
                const activityArray = activityItems.slice(i, i + BATCH_SIZE);
                console.log(`activityArray:  `, activityArray)

                const activityObject = {
                    "primaryKey": "",
                    "activitys": activityArray
                };

                const activityResponse = await fetch(activityEndpoints, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(activityObject)
                })
                if (!activityResponse.ok) throw new Error(`Activity error: ${await activityResponse.text()}`);

                processedItems += activityArray.length;
                activityBatchCount++;

                const isLastBatch = activityBatchCount === activityBatch;

                if (activityBatchCount % 5 === 0 || isLastBatch) {
                    const tempProgress = 20 + Math.round((processedItems / totalItems) * 80);
                    setProgress(tempProgress);
                }


            }

            for (let i = 0; i < baselineActivityItems.length; i += BATCH_SIZE) {
                const batchIdx = i / BATCH_SIZE;
                const activityArray = baselineActivityItems.slice(i, i + BATCH_SIZE);
                console.log(`activityArray:  `, activityArray)

                const activityObject = {
                    "primaryKey": "",
                    "activitys": activityArray
                };

                const activityResponse = await fetch(activityEndpoints, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(activityObject)
                })
                if (!activityResponse.ok) throw new Error(`Activity error: ${await activityResponse.text()}`);

                processedItems += activityArray.length;
                activityBatchCount++;

                const isLastBatch = activityBatchCount === activityBatch;

                if (activityBatchCount % 5 === 0 || isLastBatch) {
                    const tempProgress = 20 + Math.round((processedItems / totalItems) * 80);
                    setProgress(tempProgress);
                }


            }
        } catch (err) {
            setStatus(`Error processing BaselineActivity data: ${err.message}`);
            setProgressError(true);

            return;
        }




        // ========== 5. Send Resource Assignment Data ==========

        setStatus('Processing Resource Assignment data...');

        // const resourceAssignmentEndpoints = 'https://api.businesscentral.dynamics.com/v2.0/50b7a7db-965b-4a2e-8f58-39e635bf39b5/DEVUAT/api/alletec/primavera/v2.0/companies(f08e82f1-72e8-ef11-9345-6045bd14c5d0)/p6resourceassignmentroots';
        const resourceAssignmentEndpoints = 'https://api.businesscentral.dynamics.com/v2.0/50b7a7db-965b-4a2e-8f58-39e635bf39b5/Dev/api/alletec/primavera/v2.0/companies(9f813277-f624-f011-9af7-002248cb4a4f)/p6resourceassignmentroots';



        try {

            let resourceAssignmentBatchCount = 0;
            const resourceAssignmentBatch = Math.ceil(resourceAssignmentItems.length / BATCH_SIZE);

            for (let i = 0; i < resourceAssignmentItems.length; i += BATCH_SIZE) {
                const batchIdx = i / BATCH_SIZE;
                const resourceAssignmentArray = resourceAssignmentItems.slice(i, i + BATCH_SIZE);
                console.log(`resourceAssignmentArray:  `, resourceAssignmentArray)

                const resourceAssignmentObject = {
                    "primaryKey": "",
                    "resourceassignments": resourceAssignmentArray
                };

                const resourceAssignmentResponse = await fetch(resourceAssignmentEndpoints, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(resourceAssignmentObject)
                })

                if (!resourceAssignmentResponse.ok) {
                    throw new Error(`ResourceAssignment error: ${await resourceAssignmentResponse.text()}`);
                }

                processedItems += resourceAssignmentArray.length;
                resourceAssignmentBatchCount++;

                const isLastBatch = resourceAssignmentBatchCount === resourceAssignmentBatch;

                if (resourceAssignmentBatchCount % 5 === 0 || isLastBatch) {
                    const tempProgress = 20 + Math.round((processedItems / totalItems) * 80);
                    setProgress(tempProgress);
                }

            }
        } catch (err) {
            setStatus(`Error processing ResourceAssignment data: ${err.message}`);
            setProgressError(true);

            return;
        }

        setProgress(100);


        setStatus('All Resource, Project, WBS, Activity, ResourceAssignment data processed successfully!');
    };

    return (
        <div className="upload-container">
            <h2 className="upload-title">Upload Your File</h2>

            <label className="file-label">
                Select File
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="file-input"
                />
            </label>

            <label className="date-label">
                Select Upload Date:
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-input"
                    max={new Date().toISOString().split('T')[0]} // restrict to today or earlier
                />
            </label>

            <button onClick={handleProcessFile} className="submit-button">
                Process Primavera Data
            </button>

            {status && <p className="status-message">{status}</p>}

            {errorNew && <p className="status-message">{errorNew}</p>}

            {progress > 0 && (
                <div className="progress-bar-container">
                    <div className={`progress-bar ${progressError ? 'error' : ''}`} style={{ width: `${progress}%` }}>
                        {progress}%
                    </div>
                </div>
            )}
        </div>
    );
};

export default XMLDataConverter;
