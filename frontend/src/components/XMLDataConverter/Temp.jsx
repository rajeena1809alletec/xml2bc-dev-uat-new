import React from 'react'

const Temp = () => {
    const [status, setStatus] = useState('');
        const [file, setFile] = useState(null);
        const [progress, setProgress] = useState(0);
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
            if (!file) {
                setStatus('Please select a file first.');
                return;
            }
    
            setStatus('Reading file...');
            const text = await file.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'application/xml');
    
            // ========== 1. Parse Resource Nodes ==========
            const resourceNodes = xmlDoc.getElementsByTagName('Resource');
            const resources = Array.from(resourceNodes).map((node) => ({
                objectId: parseIntOrNull(node.getElementsByTagName('ObjectId')[0]?.textContent),
                autoComputeActuals: parseBool(node.getElementsByTagName('AutoComputeActuals')[0]?.textContent),
                calculateCostFromUnits: parseBool(node.getElementsByTagName('CalculateCostFromUnits')[0]?.textContent),
                calendarObjectId: parseIntOrNull(node.getElementsByTagName('CalendarObjectId')[0]?.textContent),
                currencyObjectId: parseIntOrNull(node.getElementsByTagName('CurrencyObjectId')[0]?.textContent),
               
                timesheetApprMngrObjectId: parseIntOrNull(node.getElementsByTagName('TimesheetApprovalManagerObjectId')[0]?.textContent),
                title: node.getElementsByTagName('Title')[0]?.textContent || null,
                unitOfMeasureObjectId: parseIntOrNull(node.getElementsByTagName('UnitOfMeasureObjectId')[0]?.textContent),
                uploadDate: new Date().toISOString().split('T')[0],
                useTimesheets: parseBool(node.getElementsByTagName('UseTimesheets')[0]?.textContent),
                userObjectId: parseIntOrNull(node.getElementsByTagName('UserObjectId')[0]?.textContent),
            }));
    
            // ========== 2. Parse Project Nodes ==========
            const projectNodes = xmlDoc.getElementsByTagName('Project');
            const projects = Array.from(projectNodes).map((node) => ({
                objectId: parseIntOrNull(node.getElementsByTagName('ObjectId')[0]?.textContent),
                wbsObjectId: parseIntOrNull(node.getElementsByTagName('WBSObjectId')[0]?.textContent),
                actDefCalendarObjectId: parseIntOrNull(node.getElementsByTagName('ActivityDefaultCalendarObjectId')[0]?.textContent),
                actDefCostAccountObjectId: parseIntOrNull(node.getElementsByTagName('ActivityDefaultCostAccountObjectId')[0]?.textContent),
                actDefPercentCompleteType: node.getElementsByTagName('ActivityDefaultPercentCompleteType')[0]?.textContent || "",
                actDefaultPricePerUnit: parseFloatOrNull(node.getElementsByTagName('ActivityDefaultPricePerUnit')[0]?.textContent),
                actIdBasedOnSelectedAct: parseBool(node.getElementsByTagName('ActivityIdBasedOnSelectedActivity')[0]?.textContent),
                actPerComplBaseOnActStep: parseBool(node.getElementsByTagName('ActivityPercentCompleteBasedOnActivitySteps')[0]?.textContent),
                activityDefaultActivityType: node.getElementsByTagName('ActivityDefaultActivityType')[0]?.textContent || "",
                activityDefaultDurationType: node.getElementsByTagName('ActivityDefaultDurationType')[0]?.textContent || "",
                activityIdIncrement: parseIntOrNull(node.getElementsByTagName('ActivityIdIncrement')[0]?.textContent),
                activityIdPrefix: node.getElementsByTagName('ActivityIdPrefix')[0]?.textContent || "",
                activityIdSuffix: node.getElementsByTagName('ActivityIdSuffix')[0]?.textContent || "",
                addActualToRemaining: parseBool(node.getElementsByTagName('AddActualToRemaining')[0]?.textContent),
                addedBy: node.getElementsByTagName('AddedBy')[0]?.textContent || "",
                allowNegActualUnitsFlag: parseBool(node.getElementsByTagName('AllowNegativeActualUnitsFlag')[0]?.textContent),
                allowStatusReview: parseBool(node.getElementsByTagName('AllowStatusReview')[0]?.textContent),
                annualDiscountRate: parseFloatOrNull(node.getElementsByTagName('AnnualDiscountRate')[0]?.textContent),
                anticipatedFinishDate: formatDate(node.getElementsByTagName('AnticipatedFinishDate')[0]?.textContent),
                
                webSiteURL: node.getElementsByTagName('WebSiteURL')[0]?.textContent || ""
            }));
    
            // ========== 3. Parse WBS Nodes ==========
            const wbsNodes = xmlDoc.getElementsByTagName('WBS');
    
            const wbs = Array.from(wbsNodes).map((node) => ({
                projectObjectId: parseIntOrNull(node.getElementsByTagName('ProjectObjectId')[0]?.textContent),
                objectId: parseIntOrNull(node.getElementsByTagName('ObjectId')[0]?.textContent),
                parentObjectId: parseIntOrNull(node.getElementsByTagName('ParentObjectId')[0]?.textContent),
                anticipatedFinishDate: formatDate(node.getElementsByTagName('AnticipatedFinishDate')[0]?.textContent),
                anticipatedStartDate: formatDate(node.getElementsByTagName('AnticipatedStartDate')[0]?.textContent),
                code: node.getElementsByTagName('Code')[0]?.textContent || "",
                earnedValueComputeType: node.getElementsByTagName('EarnedValueComputeType')[0]?.textContent || "",
                
                uploadDate: new Date().toISOString().split('T')[0],
                wbsCategoryObjectId: parseIntOrNull(node.getElementsByTagName('WBSCategoryObjectId')[0]?.textContent),
            }))
    
            // ========== 4. Parse Activity Nodes ==========
            const activityNodes = xmlDoc.getElementsByTagName('Activity');
            const activityItems = Array.from(activityNodes).map((node) => {
                const codeNodes = node.getElementsByTagName('Code');
                const udfNode = node.getElementsByTagName('UDF')[0];
    
                return {
                    objectId: parseIntOrNull(node.getElementsByTagName('ObjectId')[0]?.textContent),
                    guid: node.getElementsByTagName('GUID')[0]?.textContent?.replace(/[{}]/g, '') || "",
                    id: node.getElementsByTagName('Id')[0]?.textContent || "",
                    name: node.getElementsByTagName('Name')[0]?.textContent || "",
                    status: node.getElementsByTagName('Status')[0]?.textContent || "",
                    type: node.getElementsByTagName('Type')[0]?.textContent || "",
                    calendarObjectId: parseIntOrNull(node.getElementsByTagName('CalendarObjectId')[0]?.textContent),
                    projectObjectId: parseIntOrNull(node.getElementsByTagName('ProjectObjectId')[0]?.textContent),
                    wbsObjectId: parseIntOrNull(node.getElementsByTagName('WBSObjectId')[0]?.textContent),
                    startDate: parseDateOrDefault(node.getElementsByTagName('StartDate')[0]?.textContent),
                    finishDate: parseDateOrDefault(node.getElementsByTagName('FinishDate')[0]?.textContent),
                    plannedStartDate: parseDateOrDefault(node.getElementsByTagName('PlannedStartDate')[0]?.textContent),
                    plannedFinishDate: parseDateOrDefault(node.getElementsByTagName('PlannedFinishDate')[0]?.textContent),
                    remainingEarlyStartDate: parseDateOrDefault(node.getElementsByTagName('RemainingEarlyStartDate')[0]?.textContent),
                    remainingEarlyFinishDate: parseDateOrDefault(node.getElementsByTagName('RemainingEarlyFinishDate')[0]?.textContent),
                    remainingLateStartDate: parseDateOrDefault(node.getElementsByTagName('RemainingLateStartDate')[0]?.textContent),
                    remainingLateFinishDate: parseDateOrDefault(node.getElementsByTagName('RemainingLateFinishDate')[0]?.textContent),
                    actualStartDate: parseDateOrDefault(node.getElementsByTagName('ActualStartDate')[0]?.textContent),
                    actualFinishDate: parseDateOrDefault(node.getElementsByTagName('ActualFinishDate')[0]?.textContent),
                    expectedFinishDate: parseDateOrDefault(node.getElementsByTagName('ExpectedFinishDate')[0]?.textContent),
                    primaryConstraintDate: parseDateOrDefault(node.getElementsByTagName('PrimaryConstraintDate')[0]?.textContent),
                    secondaryConstraintDate: parseDateOrDefault(node.getElementsByTagName('SecondaryConstraintDate')[0]?.textContent),
                    suspendDate: parseDateOrDefault(node.getElementsByTagName('SuspendDate')[0]?.textContent),
                    resumeDate: parseDateOrDefault(node.getElementsByTagName('ResumeDate')[0]?.textContent),
                    durationType: node.getElementsByTagName('DurationType')[0]?.textContent || "",
                    
                    codeTypeObjectId8: parseIntOrNull(codeNodes[7]?.getElementsByTagName('TypeObjectId')[0]?.textContent),
                    codeValueObjectId8: parseIntOrNull(codeNodes[7]?.getElementsByTagName('ValueObjectId')[0]?.textContent),
                    codeTypeObjectId9: parseIntOrNull(codeNodes[8]?.getElementsByTagName('TypeObjectId')[0]?.textContent),
                    codeValueObjectId9: parseIntOrNull(codeNodes[8]?.getElementsByTagName('ValueObjectId')[0]?.textContent),
                    uploadDate: new Date().toISOString().split('T')[0]
                };
            });
    
            // ========== 5. Parse Resource Assignment Nodes ==========
            const resourceAssignmentNodes = xmlDoc.getElementsByTagName('ResourceAssignment');
            const resourceAssignmentItems = Array.from(resourceAssignmentNodes).map((node) => {
                return {
                    objectId: parseIntOrNull(node.getElementsByTagName('ObjectId')[0]?.textContent),
                    guid: node.getElementsByTagName('GUID')[0]?.textContent?.replace(/[{}]/g, '') || "",
                    projectObjectId: parseIntOrNull(node.getElementsByTagName('ProjectObjectId')[0]?.textContent),
                    wbsObjectId: parseIntOrNull(node.getElementsByTagName('WBSObjectId')[0]?.textContent),
                    resourceObjectId: parseIntOrNull(node.getElementsByTagName('ResourceObjectId')[0]?.textContent),
                    activityObjectId: parseIntOrNull(node.getElementsByTagName('ActivityObjectId')[0]?.textContent),
                    
    
                    unitsPercentComplete: parseFloatOrNull(node.getElementsByTagName('UnitsPercentComplete')[0]?.textContent),
    
                    resourceType: node.getElementsByTagName('ResourceType')[0]?.textContent || "",
                    uploadDate: new Date().toISOString().split("T")[0],
                };
            });
        }
    
  return (
    <div>Temp</div>
  )
}

export default Temp;