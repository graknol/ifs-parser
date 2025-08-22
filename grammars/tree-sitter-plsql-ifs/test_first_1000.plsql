-----------------------------------------------------------------------------
--
--  Logical unit: Activity
--  Component:    PROJ
--
--  IFS Developer Studio Template Version 3.0
--
--  Date    Sign    History
--  ------  ------  ---------------------------------------------------------
--  250430  geeplk  HRZ-19667, Added function Get_Activity_Seq_No_Access to resolve a performance issue.
--  250416  DSASLK  PJZ-20266, Bug 170012,   Added Project_Forecast_Conn_Det_API.Move_Activity_To_Sub_Project in Update___ method.
--  250124  HuBaUK  PJDEV-19398, Removed allocation logic from Move_Activity as allocations fetch the Sub Project info from the activity. 
--  250124  HuBaUK  PJDEV-19398, Removed allocation checks from Check_Delete___ as allocations are linked to Resource Planning lines and activity cannot be removed when planning lines exist. 
--  241203  CHMNLK  PJZ-19423, Bug 169509, Modified both Get_Elapsed_Work_Days() and Get_Baseline_Elapsed_Work_Days() functions by adding micro-cache to improve performance.
--  230330  RaNhlk  Bug 166135, Modified Close_All_Activities() to call Png_Ppsa_API.Remove_Activity().
--  210614  JanaLk  PJ21R2-352, Added Mandatory Invoice comment on Activity level
--  210531  KETKLK  PJ21R2-749, Removed PDMPRO references.
--  200529  Pesulk  PJZ-4496, Bug 154184, Modified Check_Delete___ to call Cc_Case_Business_Object_API.Check_Act_Reference_Exist.
--  200312  Henalk  PJXTEND-5271, Validations of accruals connected activity when cancelling and closing the activity  
--  190407  JANSLK  Merged Bug 147292 to method Move_Activity. 
--  190218  ISLILK  Bug 146561, Modified Get_Duration_Progress to consider the baseline dates when earned value method is baseline and progress method is duration.
--  180227  PESULK  STRPJ-25826, Modified the Copy_Activity_Rec___ to copy the 'Exclude From WAD' through copy activity functionality.
--  180219  ISPALK  STRPJ-26609, Modified Update___ to update Delivery_Structure when sub project is changed.
--  180212  PESULK  STRPJ-24660, Modified Recalculate_Work_Days__ to improve performance.
--  180201  PESULK  STRPJ-26827, Modified Check_Demote_To_Planned___ to change the cursor check_conn_objects to improve performance.
--  180129  PESULK  STRPJ-26709, Modified Verify_Date_Changes___ to correct the format of warning messages.
--  171101  NaSalk  STRPJ-24823, Modified Promote_To_Closed___, Promote_To_Completed___, Promote_To_Released___, Demote_To_Completed___, Demote_To_Planned___
--  171101          Demote_To_Released___ methods to update resource activity demand status.
--  170912  PESULK  STRPJ-24313, Merged bug 137722. Modified Get_Forecast_Duration_Days to return the today duration days if total work days is 0
--  170505  PeSuLK  STRPJ-20755, Merged Bug 134914, Added Get_Activity_Analysis_Sum_Val_().
--  170324  Jeguse  Merged Bug 131110, Added Get_Activity_Seq_Of_All to return activity seq fetching from table.
--  170324  Jeguse  Merged Bug 133343, Added Get_Cost_Hours_Progress(), and modified Get_Elapsed_work_days(), Get_Baseline_Elapsed_Work_Days().
--  170323  Jeguse  Merged Bug 133764, Modified the Copy_Activity_Rec___ to copy the project delivery address through copy activity functionality.
--  160720  Chselk  Merged Bug 130510, Modified Set_Activity_Progress to update the record in a standard way.
--  160623  Pesulk  STRPJ-13772, Modified the error messages given in Is_Activity_Reportable to be generic.
--  160202  ShRalk  STRPJ-13332, Modified Get_Forecast_Duration_Days() to add validation when total_work_days_ is zero.
--  160120  Disklk  Merged, bug 126521, Modified Update___(), called move_Activity_To_Sub_Project in ProjectResouceFcstItem.
--  160118  DISKLK  Merged bug 125818.
--  160108  SHRALK  STRPJ-12555, Modified Check_Update___ to validate setting of activity milestone.
--  151222  CPriLK  Bug 126448, Added Copy_Activity_Classes() call to Copy_Activities_Attr() and Copy_Activity_Rec___() for copying the activity classes during copy project,
--  151222          copy sub project and copy activity.
--  151210  SHRALK  STRPJ-12116. Modified Verify_Date_Changes___ to modify the validation when Completed activity exists.
--  150907  CHSELK  AFT-2385. Added new method Is_Activity_Valid_For_Project method by moved the first validation from Is_Activity_Postable().
--  150626  VISHLK  BOULDER-118, Chnaged the method signatures of Get_Elapsed_Work_Days, Get_Baseline_Elapsed_Work_Days to improve the performance.
--  150511  MONILK  Bug 122500, Modified Verify_Date_Changes___ to correct conditional compilation issue on Level_1_Forecast_API.
--  150316  Ersruk  ANPJ-50, Added condition to check activity milestone is modified or not.
--  150202  PESULK  PRPJ-4423, Modified Get_Duration_Progress function to set duration progress to elapsed work days divided by total work days.
--  141224  VISHLK  PRPJ-3899, Merged LCS bug 120381.
--  141219  CPriLK  PRPJ-3679, Moved else part of the Get_Average_Progress() to ProjectHistoryLog.
--  141211  DISKLK  Bug 120071, Modified progress methods to return 0, if the progress is negative.
--  141125  NIPJLK  PRPJ-264, Modified Check_Delete___() to check if the activity belongs to a sub project structure
--  141118  NIPJLK  PRPJ-3427, Added the annotation @UncheckedAccess to the method Get_Average_Progress.
--  141023  CPriLK  PRPJ-3000, Modified Copy_Activities_Attr() to correct the coping Responsible ID and financial responsible.
--  141018  DEKOLK  PRPJ-2064, Modified Update___ by adding sub_project_id update logic for sales contract, sub contract and application for payment when moving an avtivity.
--  240904  NIPJLK  PRPJ-2064, Added the the method Check_Activity_Exist__()
--  170904  NIPJLK  PRPJ-2406, Removed the validation in the method Check_Promote_To_Completed___()
--  140904  CHSMLK  PRPJ-1295, Removed unused parameter copy_project_id_ from Activity_Api.Copy_Activity_Rec___ procedure
--  140901  CHSMLK  PRPJ-1295, Removed unused parameter calendar_id_ from Activity_Api.Copy_Date___ procedure
--  140829  CHSMLK  PRPJ-1299, Removed unused parameter info_ from Activity_Api.Move_Actvity procedure
--  140829  CHSMLK  PRPJ-1300, Removed unused parameter in_date_ from Activity_API.Is_Activity_Released procedure
--  140829  CHSMLK  PRPJ-1301, Removed unused argument order_no_ from Activity_API.Get_Procurement_Address_Info procedure
--  140710  CHRALK Merged Bug 117080, Modified Verify_Date_Changes___() by changing the contents of a error message.
--  140613  Jobase PRPJ-567, Project Connections Refresh Performance improvements. Modified method Copy_Activity__.
--  140521  SHRALK Merged PBPJ-3257. Modified Copy_Activities_Attr() to change the value of assignment of newrec_.activity_seq to avoid unnecessary error message
--  140224  Ersruk Merged PBPJ-2030.
--  140226  AndDse Modified Level_1_Proj_Forecast_API calls to Level_1_Forecast_API, since Level_1_Proj_Forecast_API has been removed.
--  130916  MAWILK BLACK-566, Replaced Component_Pcm_SYS.
--  130611  DISKLK BRZ-4861, Removed global variables.
--  130904  DAWELK Bug 112043, Modified Unpack_Check_Insert___(),Unpack_Check_Update___(),Check_Delete___(),Reopen__().
--  130903  MAARLK Bug 109472, Modified Set_All_Days___() and Unpack_Check_Update___() to get correct activity dates and validate them correctly.
--  130902  SHRALK Bug 111602, Removed General_SYS.Init_Method in Check_Activity_Seq() to avoid security errors.
--  130821  DeKoLK Bug 111907, Modified Check_Promote_To_Closed___ to check if all WO Postings are Transferred for the given activity.
--  130827  Jeguse Bug 108452, Merged Project Resource Forecasting.
--  130816  DAWELK Bug 108683, Modified Copy_Activity__() to refresh project connections to get the connection details. Removed changes to Copy_Activity_Rec___(),Copy_Activities_Attr().
--  130816  DAWELK Bug 108683, Modified Copy_Activity__(),Copy_Activity_Rec___(),Copy_Activities_Attr() to copy estimates.
--  130814  DAWELK Bug 111187, Added new function Get_Baseline_Early_Start().Modified view ACTIVITY_CALCULATION to get correct values for activity milestones with future dates.
--  130724  SAALLK Bug 111190, Modified Unpack_Check_Insert___ to include a default value for exclude_resource_progress column.
--  130723  SAALLK Bug 111115, Fixed translation issues in Unpack_Check_Insert___.
--  130709  SAALLK Bug 110703, Added new view PROJECT_ACTIVITY_PRIV which is a duplicate of PROJECT_ACTIVITY view without the project access check.
--  130705  DeKoLK Bug 110958, Added a dummy column (dummy_company) to ACTIVITY_SUM_DETAIL.
--  130611  KAELLK Bug 108226, Set the level of entry when the progress method is Manual.
--  130607  SAALLK Bug 108226, Changes related to performance improvements when displaying summary values in Project Navigator!
--  130523  SAALLK Bug 110272, Modified Copy_Activities_Attr() to replace responsible fields with project manager if resposible person check box is unchecked when copying.
--  130506  DISKLK Bug 109869, Modified view ACTIVITY_CALCULATION and ACTIVITY_CALCULATION_PRIV BCWS column, to return amount_planned if total_work_days or baseline_total_work_days is 0.
--  130426  CPriLK Added Get_Activity_Seq_Of_All() to get activity seq without checking project access and added Get_Activity_Seq_Of_All() to get activity seq
--  130426         without checking project access.
--  130426  CPriLK Added ACTIVITY_MCPR_LOV,ACTIVITY_SHORT_NAME_MCPR_LOV views to show all the active activities without checking project access.
--  130409  VISHLK Changed Set_Manual_Progress_Complete() to set manual progress values correctly according to the level of entry of the manual progress.
--  130327  DeKoLK  Bug 109103, Convert the Activity No to UPPER Case in Unpack_Check_Insert___ and Unpack_Check_Update___.
--  130322  KAELLK  Bug 108852, exclude_resource_progress and manual progress attributes to LU. Modified Get_All_Conn_Task_Progres and Get_Non_Object_Progress.
--  130426  CPriLK Added Get_Activity_Seq_Of_All() to get activity seq without checking project access and added Get_Activity_Seq_Of_All() to get activity seq
--  130426         without checking project access.
--  130426  CPriLK Added ACTIVITY_MCPTR_LOV,ACTIVITY_SHORT_NAME_MCPTR_LOV views to show all the active activities without checking project access.
--  121219  Ersruk Bug 107348, Merged Budget and Forecast Revenue.
--                 Modifications done in Check_Demote_To_Planned___
--  130107  JEGUSE Bug 102711, Implemented some changes done in App75 bugs 102467 and 101286
--  121207  DAWELK Bug 106665, Changed view ACTIVITY_GANTT to change the column gantt_key.
--  121116  SAALLK Bug 106832, Modifed Copy_Activities_Attr() to copy progress_template of activities as well.
--  121114  SAALLK Bug 106680, Replaced the use of Installed_Component_SYS .<component> with Component_<component>_SYS.<component>
--                 when checking if a component is installed for conditional compilation.
--  121008  CHSELK Bug id 105527, Modified Delete___. Removed project_snapshot_summary_tab records when deleting an activity.
--  121002  MAARLK Bug 104255, Modified Unpack_Check_Update___(), Refresh_Activity_Costs() and Set_Activity_Progress().
--  120920  MAARLK Bug 104255, Renamed Get_Calander_Early_Start___(), Get_Calander_Early_Finish___() and Validate_All_Days___() into Get_Calander_Start___(),
--                 Get_Calander_Finish___() and Validate_User_Defined_Dates___(). Added new parameter act_milestone into Get_Calander_Start___(),
--                 Get_Calander_Finish___(), Set_All_Days___() and Set_Early_And_Work_Days___(). dified Unpack_Check_Insert___(), Unpack_Check_Update___(),
--                 Set_All_Days___(), Update___(), Set_Early_And_Work_Days___(), Get_Calander_Start___() and Get_Calander_Finish___(). Removed Set_Actual_Start___() and
--                 that logic is now included into Unpack_Check_Update___() instead Update___().
--  120904  SAALLK Bug 102549, Modified Validate_Activity_State() method to check for project access.
--  120830  SAALLK Bug 104892, Changed view ACTIVITY_GANTT column project_status to retrieve client value instead of database value.
--  120829  MAARLK Bug 104255, Modified Unpack_Check_Insert___() to validate date changes.
--  120822  CHSELK Bug id 103820. Removed proj_lu_name values ARWO,ASWO,HSWO,HRWO and used WO instead.
--  120815  MAARLK Bug 104255, Modified Unpack_Check_Update() to get correct activity dates when they are non-working days.
--                 Moved the date validation code from Set_All_Days___() to Unpack_Check_Update___().
--  120810  SUSALK Bug 104324, Modified Verify_Date_Changes___() and Update___() methods.
--  120709  SAALLK Bug 103825, Modified Refresh_Activity_Costs() to update hours_planned column as well.
--  120704  JANSLK Bug 102950, modified Check_Delete___ to check references with Call Center objects such as Cases.
--  120625  VISHLK BRZ-193 , Merged bug 102487, Changed Unpack_Check_Update___ and Unpack_Check_Insert___to set AF=AS if activity is milestone.
--  120420  JANSLK EASTRTM-3503, Changed Modify_Activity to not change Early dates when actual dates exists for the activity.
--  120419  KAELLK Added conditional compilation for unsigned dynamic code.
--  120418  VWLOZA EASTRTM-2231, Renamed references to renamed package P3_ACTIVITY_DEPENDENCY_API and P3_ACTIVITY_API.
--  120329  JANSLK EASTRTM-3503, Added Validate_All_Days___ to validate dates before setting them in unpack_check_update___.
--  120326  JANSLK EASTRTM-2162, removed calls to Attribute_Definition_API.
--  120323  PESULK EASTRTM-6508,Modified Unpack_check_insert___() to set the exclude_from_wad according to the subproject. Modifed Has_Excluded_From_Wad().
--  120321  CHSELK EASTRTM-3980. Added generation of PNG activities in copy project flow.
--  120320  CPRILK EASTRTM-4982, Modified Close__ for removing the activity from PNG_PPSA_TAB.
--  120319  SUSALK EASTRTM-3432, Modified ACTIVITY_LOV1 view.
--  120316  NASALK EASTRTM-2067. Merged LCS bug 99778. Added two new methods Cancel_Purchase_Req_Line() and Remove_Pmrp_Purch_Requitions().
--  120314  NASALK EASTRTM-4199. Modified Copy_Activities_Attr() and Move_Activity().
--  120313  VWLOZA EASTRTM-2166, Modified Set_Baseline.
--  120308  THTHLK EASTRTM-3004: Modified PROCEDURE Copy_Activities_Attr.
--  120302  SUSALK SPJ-1916, Merged Bug 101286, Modified the cursor get_user_cur of the method Copy_Activity_Rec___. Modified the application of the cursor.
--                 Modified Unpack_Check_Insert___() and Unpack_Check_Update___() to remove the validation on the value of newrec_.financially_responsible
--  280212  VWLOZA SPJ-1866, Modified Set_Baseline to prevent mutable table error when setting a baseline in IEE.
--  122012  SPJ-1760: LCS Patch Bug 101089, Added new column project_status to the Activity_Gantt view to be taken to search by project status
--  120220  SAALLK SPJ-1654, Modified Set_Baseline() to use direct updates to improve performance.
--  120217         SPJ-1722, Moved ACTIVITY_WO_OUTOFSCOPE to Post_Installation_Object handling of PROJ_INSTALLATION_API.
--  120214  SAALLK SPJ-1537, Modified Copy_Activities_Attr() to use BULK INSERTS to improve performance.
--  120214  DISKLK SPJ-1664, Added view ACTIVITY_WO_OUTOFSCOPE.
--  120127  VWLOZA Rollback bug 95277.
--  120112  VWLOZA SPJ-1087, added call to Project_Forecast_Item_API.Move_Activity_To_Sub_Project
--  120103  JANSLK SPJ-76, merged Bug 97037 changes.
--  120102  KAELLK SPJ-722, Modified conditions for check for baseline in Check_Promote_To_Cancel___.
--  111220  ROMJLK SPJ-1006,Added new View, ACTIVITY_PROJ_CONNECT.
--  111215  ROMJLK Merged Bug 99607.
--                 111107  DAWELK Bug ID 99607, Modified Verify_Date_Changes___(): Check forecast parts are within the activity dates and give a warning.
--  111209  PESULK SPJ-984, Modified Insert__(), Set objversion_ after the call to Finite_State_Init___().
--  111104  MADSLK SPJ-687, Merged LCS Patch 99653, Modified Set_All_Days___() to validate late_start and late_finish dates.
--  111102  THTHLK SPJ-440: Modified VIEW ACTIVITY_GANTT_TEMP.
--  111019  DISKLK SPJ-377, Modified ACTIVITY_CALCULATION and removed space in the view.
--  111018  DISKLK SPJ-377, Modified ACTIVITY_CALCULATION and ACTIVITY_CALCULATION_BASE views.
--  111017  CPRILK SPJ-437, Corrected CONNECT BY PRIOR usage to prevent performance problems and data errors.
--  111017  THTHLK SPJ-440: Modified VIEW ACTIVITY_GANTT_TEMP.
--  111114  NaSalk  SIZ-704, Modified Copy_Activity_Rec___.
--  021111  Ersruk  Added financially_completed.
--  111031  Ersruk  Added Validate_Closed_Activity().
--  111027  Vwloza  Added Set_Periodical_Cap_To_Included.
--  110819  Ersruk  Added new column exclude_periodical_cap.
-- -------------------SIZZLER-------------------------------------------------
--  110911  SAALLK EASTTWO-12023, Modified Get_Min_Early_Start_Sub_Proj() and Get_Max_Early_Finish_Sub_Proj() to reduce micro cache time to 1 second.
--  110829  Disklk EASTTWO-9695,Merged LCS patch 98165 Modified Get_Average_Progress().
--  110824  MADSLK EASTTWO-8464,Merged LCS Patch Bug 98469 Removed an invalid character.
--  110823  MADSLK Bug 98469, Modified method Verify_Date_Changes___(): Changed the dynamic SQL call to build lng with the error message ACTOUTOFDURTRANS.
--  110519  ShRalk Merged Bug 98139,
--                 110727  RAEKLK Bug 98139, Modified Unpack_Check_Insert___() and Unpack_Check_Update___() to check whether activity no and description contains '^' character.
--  110809  THTHLK PJDEAGLE-319: Added new PROCEDURE Set_Actual_Start___
--  110804  THTHLK PJDEAGLE-149: Bug id 94715 define options_attr_ in copy_activity__ an IN OUT parameter and add info to client sys
--  110801  NASALK Merged Bug 96631.
--                 110614  NaSalk Bug 96631, Redesigned the activity dates functionality.
--                 Added Set_Early_And_Work_Days___, Set_All_Days___, Get_Calendar_Early_Finish__, Get_Calendar_Early_Start__.
--                 Modified Unpack_Check_Insert___, Unpack_Check_Update___, Prepare_Insert___, Insert___, Update___, Verify_Date_Changes___,
--                 Set_Completed_Date___, Set_Closed_Date___, Clear_Released_Date___, Clear_Completed_Date___, Promote_To_Closed___, New, Modify,
--                 Set_Activity_Progress, Refresh_Activity_Costs and New_Activity. All date validations are done inside Verify_Date_Changes___.
--                 Removed obsolete direct methods.
--  110604  THTHLK EASTONE-17729: Modified Verify_Date_Changes___, Unpack_Check_Insert___, Insert___, Unpack_Check_Update___, Update___
--  110531  KAELLK Modified Unpack_Check_Update___ to set actual start date when estimated progress is updated.
--  110527  ShRalk Merged Bug 97148,
--        110516  Vwloza Bug 97148, Added activity sequence to several errors and warnings.
--  110527  SuSalk Merged Bug 94711,
--          101221 CHRALK Bug 94711, Modified Get_Average_Progress() to solve progress calculation problem.
--  110525  WYRALK Merged Bug 94900,
--          101221 SAALLK Bug 94900, Added column sub_project_description to PROJECT_ACTIVITY view.
--  110524  WYRALK Merged Bug 95277,
--          110211 RAEKLK Bug 95277, Added method Check_Prj_Trans_With_Inv().
--  110516  CHSELK Added missing ifs_assert_safe.
--  110511  CHSELK Modified Get_Need_Date to change the logic for work orders.
--  110506  WYRALK Set Early Finish day to be updated when only Total work days is modified.
--  110503  KAELLK Modified Clear_Released_Date___.
--  110413  Vwloza Bug 95217, Merged 95217 from APP7
--                 110111  SAALLK Bug 95217, Modified Get_Average_Progress() to calculate project progress from current values instead
--                         from history if POC is run on the same date. Added a condition to cursor get_progress_for_fin to
--                         remove Pre-Baseline values to not average out project progress values.
--  110322  WYRALK Modified Check_Promote_To_Cancel___() and Check_Promote_To_Closed___()
--          to add posting transferred checks.
--  110321  RAEKLK Bug 95940, Modified Unpack_Check_Update___() to display warning messages regarding employee allocations.
--  110207  CHRALK Bug 94707, Removed warning message added during 83463 correction.
--  110207  SAALLK Bug 95547, Modified Update___() to remove unnecessary update of set_in_baseline when updating the activity.
--  110107  SAALLK Bug 95184, Removed bullet characters fom the file as Solution Manager/VSE does not support these characters when generating and applying delta.
--  101215  SALIDE RAVEN-1362 Added VIEW_AR
--  101020  SAALLK Bug 93395, Modified Update___() to add a check to refresh estimated costs only if values have been changed.
--  101011  DAWELK Bug 85279, Modified views ACTIVITY_GANTT and ACTIVITY_GANTT_TEMP.
--  110127  Janslk  Merged Higher Peaks changes.
--  110120  KAELlK  Modified Update__ to move role assignments when sub project is modified.
--  110118  Vwloza  Corrected missing assert_safe statements
--  110114  Nasalk  HIGHPK-5670. Merged LCS issue 94420.
--                  101126  DAWELK  Bug ID 94420, Modified views ACTIVITY_GANTT and ACTIVITY_GANTT_TEMP.
--  110114  Nasalk  HIGHPK-2469. Merged LCS issue 92048.
--                  100817  SAALLK  Bug ID 92048, Modified column object_identification in ACTIVITY_GANTT to remove extra spaces in text.
--  110114  Janslk  Changed Update___ to send activity seq to Project_Snapshot_Util_API.Refresh_Snapshot_Data.
--  101206  Janslk  Added call Project_Snapshot_Util_API.Refresh_Snapshot_Data in Update___.
--  101130  RAEKLK Bug 94259, Modified ACTIVITY,ACTIVITY1,ACTIVITY_SUM_DETAIL,ACTIVITY_EXT and ACTIVITY_MSP views to change
--                 the reference view of progress_template and progress_template_step.
--  101118  Vwloza  HIGHPK-3382, technical correction.
--  100929  Vwloza  Added Get_Procurement_Address_Info
--  100805  NuVelk  Added address_id to ACTIVITY1 view.
--  100730  NuVelk  Modified  Unpack_Check_Update/Insert to prevent  manual entering of non delivery address types.
--  100714  Vwloza  Higher Peaks, Added address_id
--  100706  KAELLK  Modified Update___ to reassign project role when activity responsible or financial responsible is changed.
--  100930  WYRALK Removed access to obsolete column progress_hours_weighted introdused by Bug 89063
--                 Removed code introdused in 89176 as the method and columns are remeved in TWINPK
--  100921  CHRALK Bug 92294, Added Remove_Act_Shortcut_Rows() method call in Delete___().
--  100908  RAEKLK Bug 92304, Modified messages in Check_Promote_To_Cancel___(), Check_Promote_To_Closed___() and Check_Promote_To_Completed___().
--  100825  RAEKLK Bug 92304, Added method Check_Exist_Expense_Object() and modified Check_Promote_To_Cancel___(), Check_Promote_To_Closed___() and Check_Promote_To_Completed___().
--  100821  SAALLK Bug 92483, Modified Copy_Activity_Rec___() to correct parameter order to method call Get_Id_Version_By_Keys___().
--  100817  THTHLK Bug 91964, Modified PROCEDURE Get_Min_Early_Start_Proj, Get_Max_Early_Finish_Proj.
--  100409  HAYALK Switched REFs in progress_template, progress_template_step in the Activity view.
--  100429  CHSELK Merged Twin Peaks.
--          100304  THTHLK  Defect TWINPK-691, Modified Direct_Unpack_Check_Insert___ and Direct_Unpack_Check_Update___
--          100225  THTHLK  Modified ACTIVITY_SUM_DETAIL view.
--          100121  CHSELK  Merged App75-SP5.
--  100807  THTHLK Bug 91964, Modified PROCEDURE Check_Dates__, Verify_Date_Changes___.
--  100725  CHSELK Bug 91853, Modified Set_Baseline. Avoided copying early start, early finish, and total word days when activity is closed or completed.
--  100725  THTHLK Bug 91964, Added new PROCEDURE Check_Dates_With_Calendar___.
--                            Modified PROCEDUREs Unpack_Check_Insert___, Unpack_Check_Update___, Direct_Check_Dates__, Direct_Unpack_Check_Insert___ and Direct_Unpack_Check_Update___
--  100628  SAALLK Bug 91410, Modified Check_Promote_To_Cancel___() to check if methods exist instead of package exists.
--  100619  SAALLK Bug 91330, Modified Unpack_Check_Update___() and Unpack_Check_Insert___() to handle dates when finish date is set to a Friday for a 24 hour calendar.
--  100609  SAALLK Bug 91114, Modified Clear_Released_Date___() to clear actual_finish as well.
--  100601  SAALLK Bug 90266, Changed all references to ActivitySeq project configuration value to now check for ACTIVITY_SEQ.
--  100428  RAEKLK Bug 90202, Modified Copy_Activity_Rec___() to copy responsible person.
--  100402  SAALLK Bug 89176, Modified Set_Baseline() to recalculate activity progress when setting a baseline.
--  100222  SAALLK Bug 89063, Modified Clear_Released_Date___() to clear progress_hours_weighted as well.
--  100319  JAPALK Bug 84970 Added assert annotation.
--  100318  DEKOLK Merged Bug 89607
--                 100317 JANSLK Changed Modify_Activity to handle null values.
--                 100309 JANSLK Changed Direct_Unpack_Check_Insert___ to set correct early start and early finish dates
--                        on new activities when the these dates are set on non-working dates.
--                 100114 JANSLK Chnaged Direct_Unpack_Check_Insert___ to handle activity milestones and to allow passing of activity seq in the attribute string. Also
--                        modified New_Activity to use Direct_Unpack_Check_Insert___ and Direct_Insert___ instead of Unpack_Check_Insert___ and Insert___.
--                 091215 JANSLK Added methods New_Avtivity and Modify_Activity.
-------------------------------------------------------------------------------
--  100304  SAALLK Bug 88622, Modified view ACTIVITY_BUDGET_OVERRUN to improve performance. Modified methods Get_Min_Early_Start_Sub_Proj(), Get_Max_Early_Finish_Sub_Proj(),
--                 Get_Min_Early_Start_Proj() and Get_Max_Early_Finish_Proj() to use micro caching to improve performance.
--                  091214  RAEKLK Bug 87589, Added late_start to view ACTIVITY_CALCULATION_BASE and early_start and late_start to view ACTIVITY_CALCULATION.
--                  091211  MAZPSE Bug 85697, Modified Check_Promote_To_Cancel___() and Promote_To_Cancel___().
--                  091208  SAALLK Bug 86747, Revoked Bug 84681.
--                  091203  SAALLK Bug 87310, Modified Copy_Activity__() to copy miscellaneous demands as well when copying activities.
--                  091127  SAALLK Bug 86675, Added new method Validate_Activity_State(). Removed methods Validate_Inventory_Transfer() and Validate_Invent_Balance_Change().
--                  091125  DAWELK Bug 87268. Modified Copy_Activity_Rec___(), remove code which check COPY_DAYS.
--                  091120  SAALLK Bug 86523, Added new method Validate_Po_Receipts().
--                  091116  RAEKLK Bug 86989, Modified Unpack_Check_Insert___(), Unpack_Check_Update___(), Direct_Check_Dates__() to check Early Start Date with Calendar Start Date.
--                  091030  MAZPSE Bug 85697, Modified Finite_State_Machine___(). Created Remove_Object_Connections___(), Check_Baseline_For_Activity() and removed Has_No_Object___().
--                  091014  CHRALK Bug 86364, Modified Unpack_Check_Update___() to remove additional check for progress_template_step modification.
--                  091002  DEKOLK Bug 85911, Modified Unpack_Check_Update___() to update the Activity Short Name column, when Sub Project ID is changed.
--                  091002  CHRALK Bug 84987, Modified Get_State() to improve performance.
--                  090918  DAWELK Bug 78365, Modified Copy_Activity_Rec___() to check different options in copying activity dates.
--                  090911  VIATLK Bug 84681, Modified Unpack_Check_Update___(), to allow modifying ES when only actual start is given
--                  090902  VIATLK Bug 84681, Modified Unpack_Check_Update___(), to avoid replacing actual_finish with EF and to raise errors if ES and EF dates changed when actual start and actual finish is given.
--                  090826  VIATLK Bug 85006, Used end time of working date as the timestamp of  early_finish date. Modified Unpack_Check_Insert___() and Unpack_Check_Update___().
--                  090731  VIATLK Bug 82578, Added Check_End_Date_In_Duration__() to check if the end date belongs to duration calculation.Modified Verify_Date_Changes___() and Get_Remaining_Duration_Days().
--                  090804  RUMKLK Bug 83463, A warning message was added to Unpack_check_update() in order to accomadate the warning message for frmProjectContainer,tbwActivity by considering the
--                                 Project Transactions connected to the activity for a sub project id change.
--                  090803  WYRALK Bug 84762, Added View for Search Domain ACTIVITY_SD, Modifies other views used in Serch Domains
--                  090729  RUMKLK Bug 83463, A warning message was added to the Move_Activity() function by considering the Project Transactions connected to the activity.
--                  090720  RAEKLK Bug 81600, Modified Promote_To_Completed___() and Promote_To_Closed___() to remove unprocessed requisitions when completing the activity.
--                                 Added Remove_Requisition_By_Activity() and Check_Requisition_Exist().
--          091214  CHSELK  Added hours_planned paramaeter to Refresh_Activity_Costs ().
--          091030  KAELLK  DE419, Modified Replan__ to remove call to remove activity from PNG..
--          091027  CWICLK  DE409, Modified the method Remove__ and Delete__ to remove activity when it remove from project.
--          091015  CHSELK  Added method Set_Manual_Progress_Complete().
--          090915  CHSELK  DE224. Modified Check_Promote_To_Closed___,Check_Promote_To_Completed___. Removed 100% progress check.
--          090914  CHSELK  Added  hours_planned attribute.
--          090731  CHSELK  Removed Estimated_Hours when copying activities since this is not necessary after twin peaks development.
--          090730  KAELLK  Merged Twinpeak PMRP.
--                  090724  CWICLK Modified the method Reopen__.
--                  090626  CWICLK Added new dynamic call Png_Include_Sub_Project_API.Insert_New_Activity.
--                  090612  CWICLK Modified the method Reopen__ to add close activities back to project png.
--                  090604  CWICLK Modified Remove__ procedures to remove activity from the PPSA Within PNG table.
--                  090318  CWICLK Modified Cancel__,Close__ and Complete__ procedures to remove activity from the PPSA Within PNG table.
--                  090225  IMSILK Added procedure call to check and insert activity into "PPSA within PNG" automatically when a new activity is inserted.
--                  090205  IMSILK Twin Peaks PMRP - Added a new LOV view ACTIVITY_SHORT_NAME_PNG_LOV.
--          090724  NIRSLK  Removed Remove_Estimated_Hours() method, because bug 79838 does not exist after the Twin Peaks developments.
--          090715  CHSELK  Merged App75-SP4.
--                  090619  VIATLK Bug 84030, Modified ACTIVITY_CALCULATION_PA. Used PROJECT_TAB instead of view to avoid fresh installation errors.
--                  090603  DKARLK Bug 83208, Added attribute Generate_Safety_Stock and method Get_Generate_Safety_Stock().
--                  090526  DEKOLK Bug 80076, Modified Unpack_Check_Insert___ (), Unpack_Check_Update___(), Check_Dates__() to get correct date values for earlyfinish, early start according to the calendar.
--                  090527  MAZPSE Bug 82259, I have modified Copy_Activity_Rec___().
--                  090526  RUMKLK Bug ID 82780, Check was done for the existence of project_transactions LU and instead of project_transaction_tab table, project_transaction view was used in the cursor.
--                  090309  SAALLK Bug ID 79656, Modified Get_Average_Progress() cursor get_progress_for_fin to remove obsolete use of the GROUP BY clause.
--                  090520  RUMKLK Bug ID 82780, In order to fix errors during the SP4 ifsapp75 pre fresh installation,due to Project_Transactions_Tab not being created, changes reflected on BUG 78056 had been done by using dynamic sql.
--                  090507  DEKOLK Bug ID 78456, Defined all global lu constants which is removed from relevant specifications, and removed the API calls.
--                  090424  VIATLK Bug ID 80675, Modified calculation for SV.
--                  090421  VIATLK Bug ID 80675, Added baseline total work days and baseline elapsed work days to ACTIVITY_CALCULATION_BASE, ACTIVITY_CALCULATION and ACTIVITY_CALCULATION_PA
--                            Modified Unpack_Check_Insert___(), Insert___(),Unpack_Check_Update___() and Update___(). Added Get_Baseline_Elapsed_Work_Days() and Get_Baseline_Total_Work_Days()
--                  090406  RUMKLK Bug 79005, Modified Update___() and Set_Baseline() to send correct parameters to retrieve the value for amount_planned.
--                  090403  VIATLK Bug 80347, Increased length of sub_project_description
--                  090323  DAWELK Bug 79883, Modified Complete__(), Replan__(), Reopen__(), and Close__() by removing the calls to Check_Sub_Afp_Status().
--                                 Relevant checks are done in Project_Connection_API. Removed the method Check_Sub_Afp_Status() from Activity_API.
--                  090316  MAZPSE Bug 78477, Added access code on the table Activity_Tab so the user only get access to what he/she is entitled to.
--                  090218  SAALLK Bug ID 80263, Modified method Get_Program_Description() and view ACTIVITY_CALCULATION_PA to modify parameter list sent to Project_Program_API.Get_Description().
--                  090206  VIATLK Bug ID 79838, Added method Remove_Estimated_Hours() to remove estimated hours and its connection reported for an activity.
--                  090205  CHRALK Bug 79718, Added status checkes to progress calculation in Unpack_Check_Update___ and Set_Activity_Progress.
--                  081224  VIATLK Bug ID 78303, Modified size of attr_ in Copy_Activity_Rec___, to enable copy activity with note of 2000 characters.
--                  081125  DASASE Bug 78056, Modified Verify_Date_Changes___() to check if change of activity start and finish dates exclude any project transactions.
--          090701  NIRSLK Added calls to get revenue values in view ACTIVITY_SUM_DETAIL.
--          090325  JANSLK Removed method Get_Progress_Hours_Weighted and the column progress_hours_weighted.
--          090325  CHSELK Added  'EXCLUDE_FROM_WAD' to Prepare_Insert___.
--          090320  NIRSLK Modified Get_Duration_Progress to include all logic related to progress method, 'DURATION' progress.
--          090319  NIRSLK Removed progress_ from method signature in Refresh_Activity_Costs.
--          090317  NIRSLK Added Progress_cost and Progress_hours to views that has progress_hours_weighted and replaced progress_hours_weighted with suitable progress values.
--          090316  CHSELK Added Has_Excluded_From_Wad method.
--          090316  THTHLK Added Progress_cost and Progress_hours to Activity_Calculation_PA.
--          090313  NIRSLK Added Progress_cost and Progress_hours to Activity_Calculation_Base and ACTIVITY1.
--          090311  THTHLK Made necessary changes to cater progress method db value change
--                         Modified VIEWS Activity_Calculation, Activity_Sum_detail, Activity_EXT. Added Progress_cost and Progress_hours Columns
--          090312  CHSELK Modified Get_Average_Progress to consider excluded activities and sub projects from WAD calculation.
--          090311  THTHLK Added Get_All_Conn_Task_Progress and Get_Non_Object_Progress
--          090227  NIRSLK Estimated_Progress was made a public attribute.
--          090120  CHSELK Defect DE33. Modified Get_Average_Progress to restructure the cursors in a more correct way.
--          090116  JANSLK Modified calls to Get_Earned_Value and Get_Scheduled_Work in view ACTIVITY_SUM_DETAIL.
--          090106  CHSELK Modified ACTIVITY_SUM_DETAIL to use relavant cost and hours methods.
--          081230  CHSELK Modified ACTIVITY_BUDGET_OVERRUN view. Removed control_category_db value usage.
--          081219  NUVELK Merged SP3 code.
--                         081007  SAALLK Bug 76926, Added new method Disconnect_Cc_Task().
--                         081001  VIATLK Bug 73937, Modified Check_Delete___().
--                         080919  WYRALK Bug 76480, Modified Get_Program_Description()
--                         080917  DKARLK Bug 75015, Modified method Insert___().
--                         080811  VIATLK Bug 75758, Added Get_State_Client_Value() to return decoded state.
--                         080707  CHRALK Bug 74481, Modified Copy_Activities_Attr(), added additional parameter to Copy_Activity_Relationship() method call.
--                         080703  DKARLK Bug ID 73251, Added the view ACTIVITY_CALCULATION_PA to be used in Performance Analysis window.
--                         080612  DKARLK Bug ID 74291, Modified Set_Total_Work_Days() to Clear attr_.
--          081216  RoJalk Removed the code where value is added for ESTIMATED_HOURS in Copy_Activity_Rec___.
--          081210  JANSLK Modified the function calls for earned_value_cost, scheduled_work_cost, hours_earned_value and
--                         hours_schedule_work in view ACTIVITY_SUM_DETAIL.
--          081203  CHSELK Modified Get_Average_Progress to use hours columns as necessary.
--          081202  CHSELK Modified ACTIVITY_SUM_DETAIL to call the necessary hours methods.
--          081127  NIRSLK Modified Insert___ and Update___ methods to facilitate the change done by removing the estimated_hours column
--  091214  RAEKLK Bug 87589, Added late_start to view ACTIVITY_CALCULATION_BASE and early_start and late_start to view ACTIVITY_CALCULATION.
--  091211  MAZPSE Bug 85697, Modified Check_Promote_To_Cancel___() and Promote_To_Cancel___().
--  091208  SAALLK Bug 86747, Revoked Bug 84681.
--  091203  SAALLK Bug 87310, Modified Copy_Activity__() to copy miscellaneous demands as well when copying activities.
--  091127  SAALLK Bug 86675, Added new method Validate_Activity_State(). Removed methods Validate_Inventory_Transfer() and Validate_Invent_Balance_Change().
--  091125  DAWELK Bug 87268. Modified Copy_Activity_Rec___(), remove code which check COPY_DAYS.
--  091120  SAALLK Bug 86523, Added new method Validate_Po_Receipts().
--  091116  RAEKLK Bug 86989, Modified Unpack_Check_Insert___(), Unpack_Check_Update___(), Direct_Check_Dates__() to check Early Start Date with Calendar Start Date.
--  091105  DKARLK  Removed bug comments.
--  091030  MAZPSE Bug 85697, Modified Finite_State_Machine___(). Created Remove_Object_Connections___(), Check_Baseline_For_Activity() and removed Has_No_Object___().
--  091030  DKARLK  Removed bug comments and commented pieces of code.
--  091021  DKARLK  Removed unused internal variables.
--  091014  CHRALK Bug 86364, Modified Unpack_Check_Update___() to remove additional check for progress_template_step modification.
--  091013  MAZPSE  ME3100, Removed unused implementation methods Get_Duration_Progress(). Get_Fcast_Days_Ahead_Of_Sched() and Get_Fcast_Remain_Duration_Days().
--  091002  DEKOLK Bug 85911, Modified Unpack_Check_Update___() to update the Activity Short Name column, when Sub Project ID is changed.
--  091002  CHRALK Bug 84987, Modified Get_State() to improve performance.
--  090918  DAWELK Bug 78365, Modified Copy_Activity_Rec___() to check different options in copying activity dates.
--  090911  VIATLK Bug 84681, Modified Unpack_Check_Update___(), to allow modifying ES when only actual start is given
--  090902  VIATLK Bug 84681, Modified Unpack_Check_Update___(), to avoid replacing actual_finish with EF and to raise errors if ES and EF dates changed when actual start and actual finish is given.
--  090826  VIATLK Bug 85006, Used end time of working date as the timestamp of  early_finish date. Modified Unpack_Check_Insert___() and Unpack_Check_Update___().
--  090731  VIATLK Bug 82578, Added Check_End_Date_In_Duration__() to check if the end date belongs to duration calculation.Modified Verify_Date_Changes___() and Get_Remaining_Duration_Days().
--  090804  RUMKLK Bug 83463, A warning message was added to Unpack_check_update() in order to accomadate the warning message for frmProjectContainer,tbwActivity by considering the
--                 Project Transactions connected to the activity for a sub project id change.
--  ------------------Eagle-----------------------------------------
--  081007  SAALLK Bug 76926, Added new method Disconnect_Cc_Task().
--  081001  VIATLK Bug 73937, Modified Check_Delete___().
--  080919  WYRALK Bug 76480, Modified Get_Program_Description()
--  080917  DKARLK Bug 75015, Modified method Insert___().
--  080811  VIATLK Bug 75758, Added Get_State_Client_Value() to return decoded state.
--  080707  CHRALK Bug 74481, Modified Copy_Activities_Attr(), added additional parameter to Copy_Activity_Relationship() method call.
--  080703  DKARLK Bug ID 73251, Added the view ACTIVITY_CALCULATION_PA to be used in Performance Analysis window.
--  080612  DKARLK Bug ID 74291, Modified Set_Total_Work_Days() to Clear attr_.
--  080516  VIATLK Bug ID 71920, Removed Connect_Activity___() and modified Update___().
--  080428  SAALLK Bug 73185, Merged 7.5 PEAK uplift
--  080325  SAALLK Bug 72121, Set references on project_id and sub_project_id to NOCHECK on views ACTIVITY1 and ACTIVITY_MSP.
--  080319  DKARLK Bug 71966, Modified Finite_State_Machine___ to check if activity has connected object when chenging its status from Planned to Cancelled.
--  080205  RASELK Bug 70848, Modified view ACTIVITY_BUDGET_OVERRUN to avoid displaying records when there is no budget exceed for total cost for the activity .
--  080129  SAALLK Bug 69751, Added new method Refresh_Activity_Costs.
--  080130  RASELK Bug 70848, Modified view ACTIVITY_BUDGET_OVERRUN to avoid displaying negative exceptions.
--  071226  RAEKLK Bug 70018, Modified Direct_Update___ to update total_work_days column also and removed total_work_days_ variable from it.
--  071211  SAALLK Bug 69820, Removed creation of obsolete view DOC_PACKAGE_ID_LOV which registers DOCMAN in dictionary_sys_tab even if DOCMAN is not installed.
--                 Modified Copy_Activity_Rec___() to check if calling DOCMAN method is installed.
--  070914  ATSILK Changed in Check_Demote_To_Planned___ to exlude 'AE' objects.
--  070906  ArWilk Modified ACT_BASED_SUB_PROJ on user access.
--  070903  MAWILK Merged Bug 67091.
--  070824  ATSILK Changed in methods Set_Amount_Planned and Set_Amount_Used to do direct updates.
--  070823  ATSILK Modified methods Copy_Activity__ and Copy_Activities_Attr to handle 'Dangling Cursor Snarfing'.
--  070821  ATSILK Merged Bug 66104.
--  070813  Janslk Modofied views ACTIVITY_CALCULATION_NEW and ACTIVITY_SUM_DETAIL3 to allow project enterprise changes.
--  070807  MAWILK Modified get_attr in Get() to fetch correct values to Public_Rec.
--  070806  ARWILK Added new view ACT_BASED_SUB_PROJ.
--  070802  CHSELK Merged Bug 63371.
--                 070212  RAEKLK Bug 63371, Modified Unpack_Check_Insert___ to allowing save without 'total work days' when 'Activity Milestone' checked.
--  070726  IMGULK Added Assert_SYS Assertions.
--  070706  WYRALK Merged Bug 65101.
--  070711  MAWILK Merged Bug 63632.
--  070706  WYRALK Merged Bug 63391.
--  070625  ATSILK Merged SPARX changes to PE file.
--                 070619  MAWILK Merged Bug 65417, Modified Unpack_Check_Update___() to check for update estimated progress only if it actually modified.
--                 070615  MAWILK Merged Bug 64588, Modified Check_Promote_To_Closed___() to add activity sequence to the error message.
--                 070615  MAWILK Merged Bug 64568, Added method Calculate_Resource_Cost___() to calculate cost and prograss in activity resources
--                 070524  MAWILK Merged Bug 65168, Modified Unpack_Check_Update___() to check for update progress template step only if it actually modified.
--                 070112  ILSOLK Modified Delete__().
--                 070110  ILSOLK Modified for CCIS1300-CallCenter Ph3.
--                 061107  KARALK Bug 57550, MERGED, Removed obsolete column last_refresh_dt from ACTIVITY_MSP view.
--                 061106  KARALK Bug 60947, Merged, Modified Update__.
--                 061103  KARALK Bug 60907, MERGED Modified fix to support complete structure., Modified CURSOR where clause in Get_Average_Progress().
--                 061101  KARALK Bug 60594, merged, set incomplete activities with progress method "Manual" and
--                                          ESTIMATED_PROGRESS =1 before closing in Close__() and Close_All_Activities().
--                                          set 0 to be returned if progress is 0 in Get_Progress_Hours_Weighted()
--                 061031  KARALK Bug 60448, MERGED Modified where clause of CURSORs get_activity_count  and get_min_activity_start  in FUNCTION
--                 061031                 Get_Min_Early_Start_Sub to check sub_project_id_ with sub_project_id column instead of  checking with  total_key_path
--                 061019  KARALK Bug 59382 Merged, avioded calling cancel__() for a already cancelled activity of a
--                 061019  KARALK Bug 59276 Merged, Modified existing error messages in function Is_Activity_Reportable to show activity short name.
--  070508  ATSILK Merged SP3 changes.(It was not possible to merge the fix for bug 63629)
--                 070212  RAEKLK Bug 63371, Modified Unpack_Check_Insert___ to allowing save without 'total work days' when 'Activity Milestone' checked.
--                 070105  SAALLK Bug 62770. Modified Copy_Activity__ to include copying of the progress template.
--                 061226  RASELK Bug 61888, Modified Unpack_Check_Update___ to pass planned_cost_driver to Project_Connection_API.Get_Activity_Progress.
--                 061109  SAALLK Bug 60885, Modified Unpack_Check_Update___ to set early_finish day time to 1700 hours from 0800 hours.
--  070226  JANSLK Changed Unpack_Check_Insert___ so that financially responsible is defaulted from
--                 the sub project or project.
--  061214  ATSILK Merged SP2 changes.
-----------------------------------------------------------------------------

layer Core;

-------------------- PUBLIC DECLARATIONS ------------------------------------

CURSOR Get_Activities (project_id_  VARCHAR2,
                       key_         VARCHAR2) RETURN activity_tab%ROWTYPE IS
   SELECT *
   FROM   activity_tab
   WHERE  project_id = project_id_
   AND    node_type  = 'ACTIVITY'
   AND    total_key_path LIKE key_;


-------------------- PRIVATE DECLARATIONS -----------------------------------

text_separator_                CONSTANT VARCHAR2(1) := Client_SYS.text_separator_;

state_separator_               CONSTANT VARCHAR2(1) := Client_SYS.field_separator_;

date_time_format_              CONSTANT VARCHAR2(30) := 'fmMonth DD, YYYY, HH24:fmMI';

micro_cache_pid_min_es_proj_   activity_tab.project_id%TYPE;

micro_cache_pid_max_ef_proj_   activity_tab.project_id%TYPE;

micro_cache_pid_min_es_sub_    activity_tab.project_id%TYPE;

micro_cache_sub_id_min_es_sub_ activity_tab.sub_project_id%TYPE;

micro_cache_pid_max_ef_sub_    activity_tab.project_id%TYPE;

micro_cache_sub_id_max_ef_sub_ activity_tab.sub_project_id%TYPE;

micro_cache_min_es_proj_       activity_tab.early_start%TYPE;

micro_cache_max_ef_proj_       activity_tab.early_finish%TYPE;

micro_cache_min_es_sub_proj_   activity_tab.early_start%TYPE;

micro_cache_max_ef_sub_proj_   activity_tab.early_finish%TYPE;

micro_cache_time_min_es_proj_  NUMBER := 0;

micro_cache_time_max_ef_proj_  NUMBER := 0;

micro_cache_time_min_es_sub_   NUMBER := 0;

micro_cache_time_max_ef_sub_   NUMBER := 0;

micro_cache_ew_days_           NUMBER := 0;

micro_cache_act_seq_ew_days_   NUMBER := 0;

micro_cache_time_ew_days_      NUMBER := 0;

micro_cache_bew_days_          NUMBER := 0;

micro_cache_act_seq_bew_days_   NUMBER := 0;

micro_cache_time_bew_days_      NUMBER := 0;


-------------------- LU SPECIFIC IMPLEMENTATION METHODS ---------------------

FUNCTION Generate_Activity_Seq___ RETURN NUMBER
IS
   w_activity_seq_  NUMBER;
   
   CURSOR seq IS
      SELECT activity_seq.NEXTVAL
      FROM   DUAL;
BEGIN
   OPEN  seq;
   FETCH seq INTO w_activity_seq_;
   CLOSE seq;
   RETURN w_activity_seq_;
END Generate_Activity_Seq___;


PROCEDURE Copy_Date___ (
   attr_        IN OUT NOCOPY VARCHAR2,
   source_date_ IN            DATE,
   date_offset_ IN            NUMBER,
   field_name_  IN            VARCHAR2 )
IS
   target_date_         DATE;
BEGIN
   IF (source_date_ IS NOT NULL) THEN
      target_date_ := source_date_ + date_offset_;
      Client_SYS.Add_To_Attr(field_name_, target_date_, attr_);
   END IF;
END Copy_Date___;


PROCEDURE Copy_Activity_Rec___ (
   new_project_id_               IN VARCHAR2,
   date_offset_                  IN NUMBER,
   source_sub_project_name_      IN VARCHAR2,
   actv_                         IN activity_tab%ROWTYPE,
   options_attr_                 IN VARCHAR2,
   destination_sub_project_name_ IN VARCHAR2,
   currency_rate_fact_           IN NUMBER )
IS
   attr_                   VARCHAR2(32000);
   objid_                  VARCHAR2(50);
   objversion_             VARCHAR2(260);
   new_act_seq_            NUMBER;
   new_sub_project_id_     VARCHAR2(20);
   calendar_id_            VARCHAR2(10);
   indrec_                 Indicator_Rec;
   newrec_                 activity_tab%ROWTYPE;
   copy_or_not_            VARCHAR2(2000);
   src_key_ref_            VARCHAR2(200);
   dest_key_ref_           VARCHAR2(200);
   key_ref_                VARCHAR2(600);
   tech_class_id_          NUMBER;
   activity_estimate_tab_  Activity_Estimate_API.Activity_Estimate_Tab_Type;
   hav_records_            VARCHAR2(5);
   lu_name_temp_           VARCHAR2(100);
   copy_work_days_         VARCHAR2(2000);
   fin_response_validity_  NUMBER;

   CURSOR get_rec(activity_seq_ NUMBER) IS
      SELECT lu_name, key_ref
      FROM   activity1
      WHERE  activity_seq = activity_seq_;

   CURSOR get_user_cur(fin_responsible_ VARCHAR2) IS
      SELECT 1
      FROM   person_info
      WHERE  person_id = fin_responsible_;

BEGIN
   -- Create new activity
   Prepare_New___(newrec_);
   newrec_.project_id := new_project_id_;
   IF (source_sub_project_name_ IS NOT NULL AND actv_.sub_project_id LIKE source_sub_project_name_ || '%') THEN
      -- Rename sub project for activity
      new_sub_project_id_:= destination_sub_project_name_ || SUBSTR(actv_.sub_project_id, LENGTH(source_sub_project_name_)+1, LENGTH(actv_.sub_project_id)-LENGTH(source_sub_project_name_));
   ELSE
      -- No renaming done
      new_sub_project_id_:= actv_.sub_project_id;
   END IF;

   newrec_.sub_project_id            := new_sub_project_id_;
   newrec_.activity_no               := actv_.activity_no;
   newrec_.description               := actv_.description;
   newrec_.total_duration_days       := actv_.total_duration_days;
   newrec_.note                      := actv_.note;
   newrec_.progress_method           := actv_.progress_method;
   newrec_.planned_cost_driver       := actv_.planned_cost_driver;
   newrec_.exclude_resource_progress := actv_.exclude_resource_progress;
   newrec_.address_id                := actv_.address_id;

   IF (actv_.progress_method = Progress_Method_API.DB_MANUAL) THEN
      newrec_.manual_progress_level := actv_.manual_progress_level;
   END IF;
   -- Copy progress template
   copy_or_not_ := Client_SYS.Get_Item_Value('PROGRESS_TEMPLATE', options_attr_);
   IF (copy_or_not_ = 'YES') THEN
      IF (actv_.progress_template IS NOT NULL) THEN
         newrec_.progress_template := actv_.progress_template;
      END IF;
   END IF;
   -- Start: check different options in copying activity dates
   copy_work_days_ := Client_SYS.Get_Item_Value('COPY_WORK_DAYS', options_attr_);
   calendar_id_    := Project_API.Get_Calendar_id(newrec_.project_id);
   -- Start: Remove code which check COPY_DAYS. Its either COPY_WORK_DAYS or by default copy_days.
   IF (actv_.early_start IS NOT NULL) THEN
      newrec_.early_start := actv_.early_start + date_offset_;
   END IF;
   IF (actv_.late_start IS NOT NULL) THEN
      newrec_.late_start := actv_.late_start + date_offset_;
   END IF;
   IF (actv_.late_finish IS NOT NULL) THEN
      newrec_.late_finish := actv_.late_finish + date_offset_;
   END IF;

   IF (copy_work_days_ = 'YES') THEN
      newrec_.total_work_days := actv_.total_work_days;
   ELSE
      IF (actv_.early_finish IS NOT NULL) THEN
         newrec_.early_finish := actv_.early_finish + date_offset_;
      END IF;
   END IF;

   IF (actv_.early_start = actv_.early_finish) THEN
      Client_SYS.Add_To_Attr('ACT_MILESTONE', Fnd_Boolean_API.DB_TRUE, attr_);
      newrec_.total_work_days := 0;
   END IF;
   newrec_.exclude_periodical_cap := actv_.exclude_periodical_cap;
   newrec_.exclude_from_wad := actv_.exclude_from_wad;

   copy_or_not_ := Client_SYS.Get_Item_Value('RESPONSIBLE_PERSON',options_attr_);
   IF (copy_or_not_ = 'YES') THEN
      IF (actv_.activity_responsible IS NOT NULL) THEN
         IF ((Project_API.Get_Access_On_Off(new_project_id_) = 0) OR (Project_Access_Definition_API.Has_Project_Access(new_project_id_, new_sub_project_id_, actv_.activity_responsible) = 1)) THEN
            newrec_.activity_responsible := actv_.activity_responsible;
         END IF;
      END IF;
      IF (actv_.financially_responsible IS NOT NULL) THEN
         OPEN get_user_cur(actv_.financially_responsible);
         FETCH get_user_cur INTO fin_response_validity_;
         CLOSE get_user_cur;
         IF (fin_response_validity_ = 1) THEN
            newrec_.financially_responsible := actv_.financially_responsible;
         END IF;
      END IF;
   END IF;

   indrec_ := Get_Indicator_Rec___(newrec_);
   Check_Insert___(newrec_, indrec_, attr_);
   Insert___(objid_, objversion_, newrec_, attr_);

   newrec_      := Get_Object_By_Id___ (objid_);
   new_act_seq_ := newrec_.activity_seq;

   INSERT
      INTO temp_activity_copy_tab (activity_seq,
                                   session_id,
                                   new_activity_seq)
      VALUES (actv_.activity_seq,
              SYS_CONTEXT('USERENV', 'SESSIONID'),
              new_act_seq_);
   -- Copy activity details as a Activity Estimate connection
   Project_Connection_Details_API.Get_Estimate_Copy_Values(activity_estimate_tab_, hav_records_, actv_.activity_seq, currency_rate_fact_, options_attr_);
   IF (hav_records_ = 'TRUE') THEN
      Activity_Estimate_API.Create_Estimates_Copy_Activity(new_act_seq_, activity_estimate_tab_);
   END IF;
   -- Copy Activity Classes
   copy_or_not_ := Client_SYS.Get_Item_Value('COPYACTIVITYCLASSES',options_attr_);
   IF (copy_or_not_ = 'YES') THEN
      Project_Activity_Class_Act_API.Copy_Activity_Classes(actv_.activity_seq, new_act_seq_);
   END IF;

   -- copy activity characteristics
   OPEN  get_rec(actv_.activity_seq);
   FETCH get_rec INTO lu_name_temp_, key_ref_;
   CLOSE get_rec;
   tech_class_id_ := Technical_Object_Reference_API.Exist_Reference_(lu_name_temp_, key_ref_);
   IF (tech_class_id_ != - 1) THEN
      Technical_Object_Reference_API.Copy_Values (actv_.activity_seq||'^' ,
                                                  new_act_seq_||'^' ,
                                                  1,
                                                  NULL,
                                                  lu_name_temp_,
                                                  lu_name_temp_);
   END IF;
   -- Copy Task
   copy_or_not_ := Client_SYS.Get_Item_Value('TASK', options_attr_);
   IF (copy_or_not_ IS NULL OR upper(copy_or_not_) = 'YES') THEN
      Activity_Task_API.Copy_Task_Conns(actv_.activity_seq, new_act_seq_, currency_rate_fact_,options_attr_);
   END IF;
   -- Copy Document Packages
   copy_or_not_ := Client_SYS.Get_Item_Value('DOCPACK', options_attr_);
   IF (copy_or_not_ IS NULL OR upper(copy_or_not_) = 'YES') THEN
      $IF (Component_Docman_SYS.INSTALLED) $THEN
         Doc_Package_Id_API.Copy_Document_Packages (actv_.activity_seq, new_act_seq_);
      $ELSE
         NULL;
      $END
   END IF;
   -- copy activity resource
   copy_or_not_ := Client_SYS.Get_Item_Value('RESOURCE', options_attr_);
   IF (upper(copy_or_not_) = 'YES') THEN
      Activity_Resource_API.Copy_Resource_Attr(new_act_seq_, new_sub_project_id_, new_project_id_, actv_.activity_seq, options_attr_);
   END IF;

   -- Copy Document References
   copy_or_not_ := Client_SYS.Get_Item_Value('DOCOVERVIEW', options_attr_);
   IF (copy_or_not_ = 'YES') THEN
      $IF (Component_Docman_SYS.INSTALLED) $THEN
         src_key_ref_  := Client_SYS.Get_Key_Reference(lu_name_temp_, 'ACTIVITY_SEQ', actv_.activity_seq);
         dest_key_ref_ := Client_SYS.Get_Key_Reference(lu_name_temp_, 'ACTIVITY_SEQ', new_act_seq_);
         Doc_Reference_Object_API.Copy(lu_name_temp_,src_key_ref_,lu_name_temp_,dest_key_ref_);
      $ELSE
         NULL;
      $END
   END IF;
   -- Standard Activity Cost in project reporting
   copy_or_not_ := Client_SYS.Get_Item_Value('ACTCOST', options_attr_);
   IF (copy_or_not_ = 'YES') THEN
      $IF (Component_Prjrep_SYS.INSTALLED) $THEN
         Activity_Cost_API.Copy_Activity_Cost (actv_.activity_seq, new_act_seq_);
      $ELSE
         NULL;
      $END
   END IF;
END Copy_Activity_Rec___;


FUNCTION Release_Allowed___ (
   project_id_ IN VARCHAR2 ) RETURN BOOLEAN
IS
BEGIN
   IF (Project_API.Is_Approved(project_id_) = 1 AND NOT(Project_API.Is_Completed(project_id_) = 1)) THEN
      RETURN TRUE;
   ELSE
      Error_SYS.Record_General(lu_name_,'PROJECTNOTAPPROVED: Project is not approved or it is completed.');
      RETURN FALSE;
   END IF;
END Release_Allowed___;


PROCEDURE Verify_Date_Changes___ (
   newrec_      IN OUT NOCOPY activity_tab%ROWTYPE,
   oldrec_      IN            activity_tab%ROWTYPE,
   calendar_id_ IN            VARCHAR2 )
IS
   calendar_min_start_date_ DATE;
   calendar_max_end_date_   DATE;
   planned_start_date_      DATE;
   planned_finish_date_     DATE;
   activity_offset_         NUMBER;
   misc_offset_             NUMBER;
   out_of_duration_         VARCHAR2(20);
   last_calendar_date_      DATE;
   activity_short_name_     VARCHAR2(100);
   
   $IF (Component_Prjrep_SYS.INSTALLED) $THEN
      CURSOR get_rec_ IS
      SELECT *
      FROM   project_transaction
      WHERE  activity_seq = newrec_.activity_seq;
   $END
BEGIN
   last_calendar_date_:= Database_SYS.Get_Last_Calendar_Date;
   IF (newrec_.early_start IS NULL AND newrec_.node_type = Activity_Node_Type_API.DB_ACTIVITY) THEN
      Error_SYS.Record_General(lu_name_, 'NOEARLYSTART: You must enter a value for Early Start.');
   END IF;
   IF (newrec_.early_finish IS NULL AND newrec_.total_work_days IS NULL AND newrec_.node_type = Activity_Node_Type_API.DB_ACTIVITY) THEN
      Error_SYS.Record_General(lu_name_, 'CALEFTOTA: Early Finish or Total Work Days must be filled in.', NULL, NULL, NULL);
   END IF;

   calendar_min_start_date_ := Work_Time_Calendar_Desc_API.Get_Min_Start_Date(calendar_id_ => calendar_id_);
   calendar_max_end_date_   := Get_Calendar_Finish__(Work_Time_Calendar_Desc_API.Get_Max_End_Date(calendar_id_), calendar_id_, 'FALSE');

   IF (newrec_.early_start  NOT BETWEEN calendar_min_start_date_ AND calendar_max_end_date_) AND
      ((newrec_.early_finish IS NULL AND newrec_.node_type = Activity_Node_Type_API.DB_ACTIVITY) 
      OR (newrec_.early_finish NOT BETWEEN calendar_min_start_date_ AND calendar_max_end_date_)) THEN
      Error_SYS.Record_General(lu_name_, 'NOTWITHINCAL: Early Start and Early Finish dates of the activity are not within the project calendar.');
   ELSIF (newrec_.early_start  NOT BETWEEN calendar_min_start_date_ AND calendar_max_end_date_) THEN
      Error_SYS.Record_General(lu_name_, 'NOTWITHINCALES: Early Start date of the activity is not within the project calendar.');
   ELSIF ((newrec_.early_finish IS NULL AND newrec_.node_type = Activity_Node_Type_API.DB_ACTIVITY)  OR (newrec_.early_finish NOT BETWEEN calendar_min_start_date_ AND calendar_max_end_date_)) THEN
      Error_SYS.Record_General(lu_name_, 'NOTWITHINCALEF: Early Finish date of the activity is not within the project calendar.');
   END IF;

   IF (newrec_.early_start IS NOT NULL AND NVL(oldrec_.early_start, last_calendar_date_) != newrec_.early_start) THEN
      IF ((Work_Time_Calendar_API.Is_Working_Day(calendar_id_ , newrec_.early_start) = 0) OR
          (Work_Time_Calendar_API.Is_Working_Time_For_Time(calendar_id_ , newrec_.early_start) = 0)) THEN
         Client_SYS.Add_Warning(lu_name_, 'ACTTESTRTILL: Early Start will be set to :P1. This is a non-working day or time in the Work Time Calendar.', to_char(newrec_.early_start, date_time_format_));
      END IF;
   END IF;
   
   IF (newrec_.early_finish IS NOT NULL AND NVL(oldrec_.early_finish, last_calendar_date_) != newrec_.early_finish) THEN
      IF ((Work_Time_Calendar_API.Is_Working_Day(calendar_id_ , newrec_.early_finish) = 0) OR
          (Work_Time_Calendar_API.Is_Working_Time_For_Time(calendar_id_ , newrec_.early_finish) = 0)) THEN
         Client_SYS.Add_Warning(lu_name_, 'ACTTEFINILL: Early Finish will be set to :P1. This is a non-working day or time in the Work Time Calendar.', to_char(newrec_.early_finish, date_time_format_));
      END IF;
   END IF;

   IF (newrec_.late_start IS NOT NULL AND NVL(oldrec_.late_start, last_calendar_date_) != newrec_.late_start) THEN
      IF Work_Time_Calendar_API.Is_Working_Day(calendar_id_ , newrec_.late_start) = 0 THEN
         Client_SYS.Add_Warning(lu_name_, 'ACTTLSTRTILL: Late Start will be set to :P1. This not a working day.', newrec_.late_start, NULL, NULL);
      END IF;
   END IF;
   
   IF (newrec_.late_finish IS NOT NULL AND NVL(oldrec_.late_finish, last_calendar_date_) != newrec_.late_finish)THEN
      IF Work_Time_Calendar_API.Is_Working_Day(calendar_id_ , newrec_.late_finish) = 0 THEN
         Client_SYS.Add_Warning(lu_name_, 'ACTTLFINILL: Late Finish will be set to :P1. This not a working day.', newrec_.late_finish, NULL, NULL);
      END IF;
   END IF;

   IF ((newrec_.rowstate = 'Planned'  OR newrec_.rowstate IS NULL) AND (newrec_.actual_start IS NOT NULL OR newrec_.actual_finish IS NOT NULL)) THEN
      Error_SYS.Record_General(lu_name_, 'ACTPLANACTILL: The activity is in status Planned. You are not allowed to enter Actual Date values.', NULL, NULL, NULL);
   END IF;
   IF (newrec_.rowstate = 'Completed' AND (newrec_.actual_start IS NULL )) THEN
      Error_SYS.Record_General(lu_name_, 'ACTCOMPACTILL: The activity is in status Completed. You are not allowed to remove the actual start date.', NULL, NULL, NULL);
   END IF;

   IF newrec_.early_start IS NOT NULL AND newrec_.early_finish IS NOT NULL THEN
      IF (newrec_.early_start > newrec_.early_finish) THEN
         IF (newrec_.actual_start IS NOT NULL) THEN
            IF (newrec_.actual_finish IS NOT NULL) THEN
               Error_SYS.Record_General(lu_name_, 'ASTARTBIGGERAFIN: Actual Start is later than Actual Finish.');
            END IF;
            Error_SYS.Record_General(lu_name_, 'ASTARTBIGGEREFIN: Actual Start is later than Early Finish.');
         END IF;
         IF (newrec_.total_work_days >=0) THEN
            Error_SYS.Record_General(lu_name_, 'ESTARTBIGGEREFIN: Early Start is later than Early Finish.');
         END IF;
      END IF;
      IF (newrec_.actual_start > newrec_.actual_finish) THEN
         Error_SYS.Record_General(lu_name_, 'ASTARTBIGGERAFIN: Actual Start is later than Actual Finish.');
      END IF;
      IF (newrec_.actual_start IS NULL) AND (newrec_.actual_finish IS NOT NULL) THEN
         Error_SYS.Record_General(lu_name_, 'ASTARTNULL: Actual Start must have a value when Actual Finish has a value.');
      END IF;
   END IF;
   
   IF (newrec_.total_work_days < 0) THEN
      Error_SYS.Record_General(lu_name_, 'TWDBELZERO: Total Work Days must be a positive number.', NULL, NULL, NULL);
   END IF;
   IF (newrec_.late_start IS NOT NULL AND newrec_.late_finish IS NOT NULL) THEN
      IF (newrec_.late_start > newrec_.late_finish) THEN
         activity_short_name_ := CONCAT(CONCAT(CONCAT(newrec_.activity_seq,' ('),newrec_.short_name),')');
         Error_SYS.Record_General(lu_name_, 'LSTARTBIGGERLFIN: Late Start :P1 is later than Late Finish :P2 for activity :P3. Please check dates and constraints of the activity.',newrec_.late_start, newrec_.late_finish, activity_short_name_ );
      END IF;
   END IF;

   IF (newrec_.early_start != oldrec_.early_start OR newrec_.early_finish != oldrec_.early_finish) THEN
      $IF (Component_Prjrep_SYS.INSTALLED) $THEN
         FOR rec_ IN get_rec_ LOOP
            IF NOT ((rec_.account_date >= trunc(newrec_.early_start)) AND (rec_.account_date <= trunc(newrec_.early_finish))) THEN
               out_of_duration_ := 'TRUE';
               EXIT;
            END IF;
         END LOOP;
         IF (out_of_duration_ = 'TRUE') THEN
            Error_SYS.Record_General(lu_name_, 'ACTOUTOFDURTRANS: There are project transactions which will be out of the duration of the activity :P1 (:P2).', Get_Short_Name(newrec_.activity_seq), newrec_.activity_seq, NULL);
         END IF;
      $ELSE
         NULL;
      $END
      IF (Proj_Resource_Allocation_API.Fixed_Allocation_Outside(activity_seq_ => newrec_.activity_seq,
                                                                date_from_    => newrec_.early_start,
                                                                date_to_      => newrec_.early_finish) = Fnd_Boolean_API.DB_TRUE) THEN
         Client_SYS.Add_Warning(lu_name_, 'RESALLOCOUTOFRANGE: Updated activity dates will not move fixed resource allocations. At least one fixed resource allocation exists that will fall outside of the activity duration.');
      END IF;
   END IF;
   
   planned_start_date_ := Project_API.Get_Plan_Start(newrec_.project_id);
   planned_finish_date_:= Project_API.Get_Plan_Finish(newrec_.project_id);
   
   IF (trunc(newrec_.early_start) NOT BETWEEN trunc(planned_start_date_) AND trunc(planned_finish_date_)) AND (trunc(newrec_.early_finish) NOT BETWEEN trunc(planned_start_date_) AND trunc(planned_finish_date_)) THEN
      Client_SYS.Add_Warning(lu_name_,'INVDSALI_DATE: Early Start Date and the Early Finish Date of the activity is not between the Planned Start Date and Planned Finish Date of the project.');
   ELSIF (trunc(newrec_.early_start) NOT BETWEEN trunc(planned_start_date_) AND trunc(planned_finish_date_)) THEN
      Client_SYS.Add_Warning(lu_name_,'INVAL_DATE: Early start Date of the activity is not between the Planned Start Date and Planned Finish Date of the project.');
   ELSIF (trunc(newrec_.early_finish) NOT BETWEEN trunc(planned_start_date_) AND trunc(planned_finish_date_))THEN
      Client_SYS.Add_Warning(lu_name_,'INVALI_DATE: Early Finish Date of the activity is not between the Planned Start Date and Planned Finish Date of the project.');
   END IF;
   
   IF (TRUNC(newrec_.early_start) != TRUNC(oldrec_.early_start) OR
       TRUNC(newrec_.early_finish) != TRUNC(oldrec_.early_finish)) THEN
      IF (Activity_Resource_API.Check_Activity_Exist (newrec_.activity_seq)) THEN
         Client_SYS.Add_Warning(lu_name_,'SHORTUNSPREAD: Changing activity duration may have impact on Resource Planning Unspread Hours.');
      END IF;
   END IF;
   
   activity_offset_ := Activity_Task_API.Get_Max_Offset(newrec_.activity_seq);
   misc_offset_     := Project_Misc_Procurement_API.Get_Max_Offset(newrec_.activity_seq);
   
   IF (trunc(newrec_.early_start)+ activity_offset_) > (trunc(newrec_.early_finish)) THEN
      Error_SYS.Record_General(lu_name_, 'OFFSETLARGE: Task Start Date of at least one Task is later than Activity Early Finish Date.', NULL, NULL, NULL);
   END  IF;
   
   IF (trunc(newrec_.early_finish)- misc_offset_) < (trunc(newrec_.early_start)) THEN
      Error_SYS.Record_General(lu_name_, 'OFFSETLARGEMISC: Required Date of at least one miscellaneous demand is earlier than Activity Early Start Date.', NULL, NULL, NULL);
   END IF;
   
   $IF (Component_Massch_SYS.INSTALLED) $THEN
      IF (Level_1_Forecast_API.Check_Activity_Exist(newrec_.activity_seq) = 'TRUE') THEN
         IF (Level_1_Forecast_API.Check_Any_Fcst_For_Act_Dates(newrec_.activity_seq, newrec_.early_start, newrec_.early_finish) = 'FALSE') THEN
            Error_SYS.Record_General(lu_name_,'ACTOUTOFDURFORECASTPARTS: There are forecast demands with forecast dates which fall outside the activity duration.', NULL, NULL, NULL);
         END IF;
      END IF;
   $END
END Verify_Date_Changes___;


PROCEDURE Set_Released_Date___ (
   attr_ IN OUT VARCHAR2,
   rec_  IN     activity_tab%ROWTYPE)
IS
   objid_       VARCHAR2(50);
   objversion_  VARCHAR2(260);
   newrec_      activity_tab%ROWTYPE;
BEGIN
   newrec_ := Lock_By_Keys___(rec_.activity_seq);
   Get_Id_Version_By_Keys___(objid_, objversion_, newrec_.activity_seq);
   newrec_.released_date := sysdate;
   Update___(objid_, rec_, newrec_, attr_,objversion_);
   Client_SYS.Add_To_Attr('RELEASED_DATE',newrec_.released_date, attr_);
END Set_Released_Date___;


PROCEDURE Set_Closed_Date___ (
   attr_ IN OUT VARCHAR2,
   rec_  IN     activity_tab%ROWTYPE)
IS
   objid_       VARCHAR2(50);
   objversion_  VARCHAR2(260);
   newrec_      activity_tab%ROWTYPE;
   indrec_      Indicator_Rec;
BEGIN
   newrec_ := Lock_By_Keys___(rec_.activity_seq);
   Get_Id_Version_By_Keys___(objid_, objversion_, newrec_.activity_seq);
   -- Setting actual_finish to early IF it doesn't already have a value
   IF (newrec_.actual_finish IS NULL) THEN
      newrec_.actual_finish := newrec_.early_finish;
   END IF;
   IF (newrec_.actual_start IS NULL) THEN
      newrec_.actual_start := newrec_.early_start;
   END IF;
   newrec_.closed_date := sysdate;
   Unpack___(newrec_, indrec_, attr_);
   Check_Update___(rec_, newrec_, indrec_, attr_);
   Update___(objid_, rec_, newrec_, attr_,objversion_);
   Client_SYS.Add_To_Attr('CLOSED_DATE',newrec_.closed_date, attr_);
   Client_SYS.Add_To_Attr('ACTUAL_FINISH', newrec_.Actual_finish, attr_);
   Client_SYS.Add_To_Attr('ACTUAL_START', newrec_.Actual_start, attr_);
END Set_Closed_Date___;


PROCEDURE Set_Completed_Date___ (
   attr_ IN OUT VARCHAR2,
   rec_  IN     activity_tab%ROWTYPE)
IS
   objid_       VARCHAR2(50);
   objversion_  VARCHAR2(260);
   newrec_      activity_tab%ROWTYPE;
   indrec_      Indicator_Rec;
BEGIN
   newrec_ := Lock_By_Keys___(rec_.activity_seq);
   Get_Id_Version_By_Keys___(objid_, objversion_, newrec_.activity_seq);
   -- Setting start to early IF it doesn't already have a value
   IF (newrec_.actual_start IS NULL) THEN
      newrec_.actual_start := newrec_.early_start;
   END IF;
   newrec_.completed_date := sysdate;
   Unpack___(newrec_, indrec_, attr_);
   Check_Update___(rec_, newrec_, indrec_, attr_);
   Update___(objid_, rec_, newrec_, attr_,objversion_);
   Client_SYS.Add_To_Attr('COMPLETED_DATE',newrec_.completed_date, attr_);
   Client_SYS.Add_To_Attr('ACTUAL_FINISH', newrec_.Actual_finish, attr_);
   Client_SYS.Add_To_Attr('ACTUAL_START', newrec_.Actual_start, attr_);
END Set_Completed_Date___;


PROCEDURE Clear_Released_Date___ (
   attr_ IN OUT VARCHAR2,
   rec_  IN     activity_tab%ROWTYPE)
IS
   objid_       VARCHAR2(50);
   objversion_  VARCHAR2(260);
   newrec_      activity_tab%ROWTYPE;
   indrec_      Indicator_Rec;
BEGIN
   newrec_ := Lock_By_Keys___(rec_.activity_seq);
   newrec_.released_date         := NULL;
   newrec_.estimated_progress    := NULL;
   newrec_.manual_progress_cost  := NULL;
   newrec_.manual_progress_hours := NULL;
   newrec_.actual_start          := NULL;
   newrec_.actual_finish         := NULL;
   Get_Id_Version_By_Keys___(objid_, objversion_, newrec_.activity_seq);
   Unpack___(newrec_, indrec_, attr_);
   Check_Update___(rec_, newrec_, indrec_, attr_);
   Update___(objid_, rec_, newrec_, attr_,objversion_);
   Client_SYS.Add_To_Attr('RELEASED_DATE',newrec_.released_date, attr_);
END Clear_Released_Date___;


PROCEDURE Clear_Closed_Date___ (
   attr_ IN OUT VARCHAR2,
   rec_  IN     activity_tab%ROWTYPE)
IS
   objid_       VARCHAR2(50);
   objversion_  VARCHAR2(260);
   newrec_      activity_tab%ROWTYPE;
BEGIN
