import csv
import json
from collections import Counter, defaultdict

# Load Subjects catalog
subjects_file = "d:/ANTI GRAVITY/Admin Panel Edstaq/schema/HR & Sales - Subjects.csv"
subjects_map = {}
with open(subjects_file, mode="r", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for r in reader:
        s_id = (r.get("Subject ID") or "").strip()
        if s_id:
            subjects_map[s_id] = {
                "name": (r.get("Subject Name") or "").strip(),
                "stage": (r.get("Stage") or "").strip(),
                "board": (r.get("Board") or "").strip(),
                "level": (r.get("Level") or "").strip(),
                "label": (r.get("Label") or "").strip(),
                "category": (r.get("Category") or "").strip(),
            }

csv_data = """Student Name,Phone Number,Subject ID,Teacher ID,Slot Date,Slot Time,Slot End Time,Medium,Teaching Language,Meeting Link,Demo Status,Date,Demo ID,Executive,Last Update,Feedback,Note,Responsible,Teach Rate,Entity Type,Entity ID,Activity Category
sanha,8138856697,SUB252,TCH106,2025-10-25,19:00,19:34,English,Malayalam,https://meet.google.com/ixp-fipv-riw,Rejected,2025-10-26,DMO101,data.edstaq@gmail.com,21/01/2026 10:44:15,uss exam class is issue,Rejected,Ragil,,Lead,L00131,Teaching Demo
Safa,9526859832,SUB227,TCH108,2025-10-25,19:00,20:00,English,Malayalam,https://meet.google.com/erz-bpzk-gsm,Converted to Sale,2025-10-26,DMO102,data.edstaq@gmail.com,04/11/2025 12:34:23,wrong demo request data but managed and given best perfomance,,Adnan,,Lead,L05504,Teaching Demo
Ardra,9562531766,SUB299,TCH112,2025-10-25,19:00,19:33,English,Malayalam,https://meet.google.com/wem-aymj-hey,Rejected,2025-10-26,DMO103,data.edstaq@gmail.com,04/11/2025 12:18:01,okey with classes but financial problem,,Ragil,,Lead,L00261,Teaching Demo
Hena Fathima,8714121390,SUB223,TCH102,2025-10-28,19:30,20:30,English,Malayalam,https://meet.google.com/pzq-zzug-txr,Rejected,2025-10-27,DMO104,data.edstaq@gmail.com,04/11/2025 12:37:38,,student not available at that time and not responsible,Faris,,Lead,L00309,Teaching Demo
Aman,9539788690,SUB283,TCH105,2025-10-27,19:30,20:30,Malayalam,Malayalam,https://meet.google.com/pzq-zzug-txr,Rejected,2025-10-27,DMO105,data.edstaq@gmail.com,21/01/2026 10:43:41,parent another son have tuition for +2 1:1 tuition with 5500 per month. finally they discuss and say later,cold lead,Sinan M,,Lead,,Teaching Demo
Fathima shyma,‪9846188258‬,SUB283,TCH111,2025-10-28,19:00,20:00,Malayalam,Malayalam,https://meet.google.com/ipd-iirk-paa,Rejected,2025-10-28,DMO106,data.edstaq@gmail.com,21/01/2026 10:42:58,class okey but payment issue,,Faris,,Lead,,Teaching Demo
Abeela,9495295234,SUB200,TCH108,2025-10-28,20:30,20:50,English,Malayalam,https://meet.google.com/adj-ksaf-ixp,Rejected,2025-10-28,DMO107,data.edstaq@gmail.com,04/11/2025 07:17:53,Rejected,,Sinan M,,Lead,L00124,Teaching Demo
Muhammed Annos,8590302792,SUB239,TCH114,2025-10-29,19:00,20:00,English,Malayalam,https://meet.google.com/ucj-tdrm-mme,Rejected,2025-10-29,DMO108,adhnanmuhammad40@gmail.com,04/11/2025 12:17:23,avane grandma aanu nokunne  so even 1000 per month tharan polum avrde aduthu illa. class ellam avark ishtam aytundu.,,Ragil,,Lead,L00347,Teaching Demo
Nafih,9846042843,SUB199,TCH102,2025-10-29,19:00,20:00,English,,https://meet.google.com/eec-xqnq-ram,Rejected,2025-10-29,DMO109,adhnanmuhammad40@gmail.com,21/01/2026 10:42:30,very hot lead. they call back soon today. already willing to conduct 30/10 th n8 class,,Sinan M,,Lead,L00371,Teaching Demo
Liya Fathima,8943695345,SUB296,TCH114,2025-10-28,19:00,20:00,English,Malayalam,https://meet.google.com/drt-syaz-kom,Converted to Sale,2025-10-28,DMO110,data.edstaq@gmail.com,04/11/2025 12:36:30,Converted,,Adnan,,Lead,L05505,Teaching Demo
Nuha hilmi,9744405332,SUB181,TCH102,2025-10-30,20:30,21:00,English,,https://meet.google.com/mqr-rfic-iaf,Rejected,2025-10-30,DMO111,data.edstaq@gmail.com,11/11/2025 17:57:06,Fathernode samsarikanam,,Adnan,,Lead,L00041,Teaching Demo
mohhamud afwin,9633052149,SUB224,TCH108,2025-10-31,20:30,21:00,Malayalam,malayalam,https://meet.google.com/gdn-szqv-yoq,Rejected,2025-10-30,DMO112,data.edstaq@gmail.com,11/11/2025 18:02:50,"They liked the class,",money problem,Adnan,,Lead,L00415,Teaching Demo
Sreenantha,7306948304,SUB259,TCH104,2025-10-30,20:00,21:00,Malayalam,,https://meet.google.com/rey-nehz-nzh,Rejected,2025-10-30,DMO113,adhnanmuhammad40@gmail.com,21/01/2026 10:42:11,Ignored based on kalolsavam issue.,But actually they rejected,Faris,,Lead,L00358,Teaching Demo
Ayzeen,8593902940,SUB158,TCH101,2025-10-31,20:00,21:00,English,,https://meet.google.com/bpq-ngzt-fep,Rejected,2025-10-31,DMO114,data.edstaq@gmail.com,21/01/2026 10:42:00,very satisfied. ask to husband and say tomorrow,sinan,Sinan M,,Lead,L00468,Teaching Demo
Fathima Beevi,9061492969,SUB177,TCH109,2025-11-04,20:00,21:00,English,,https://meet.google.com/qha-jbtd-tuu,Rejected,2025-11-03,DMO115,data.edstaq@gmail.com,21/01/2026 10:41:43,Financial issue,Able to group class,Faris,,Lead,L00596,Teaching Demo
Aizin,8593902940,SUB155,TCH101,2025-11-03,19:00,20:00,English,Malayalam,https://meet.google.com/hqd-ddjy-tbx,Rejected,2025-11-03,DMO116,data.edstaq@gmail.com,11/11/2025 17:59:39,Satisfied. Now cleared payment details. So let mother ask to father,Class ok money problem,Sinan M,,Lead,L00468,Teaching Demo
Ahmed Risham,8157057892,SUB296,TCH114,2025-11-05,20:30,20:30,Malayalam,Malayalam,https://meet.google.com/tgk-kvwt-vqe,Rejected,2025-11-05,DMO117,data.edstaq@gmail.com,21/01/2026 10:41:21,The class is fine. The mother said she needs to discuss it with the father before making a decision.,,Ragil,4.5,Lead,L00642,Teaching Demo
Amarnath,9778779269,SUB177,TCH108,2025-11-05,19:30,20:30,English,,https://meet.google.com/gxc-xqeq-osj,Rejected,2025-11-05,DMO118,data.edstaq@gmail.com,11/11/2025 18:00:12,"Call tomorrow, The mother told that she have to talk about this to his father and to make a decision",The Student is so low in English to speak and to write to read we have to start some the basics,Faris,,Lead,L00657,Teaching Demo
Ansili,9645904875,SUB294,TCH108,2025-11-07,19:30,20:30,English,,https://meet.google.com/gxc-xqeq-osj,Rejected,2025-11-06,DMO119,data.edstaq@gmail.com,25/11/2025 10:09:57,,,Ragil,,Lead,L00727,Teaching Demo
bajil,9961746666,SUB289,TCH114,2025-11-08,15:00,16:00,English,english and malayalam,https://meet.google.com/gkt-iweq-uwf,Rejected,2025-11-09,DMO120,data.edstaq@gmail.com,21/01/2026 10:40:56,teacher not took class by any topic said by parent.,,Faris,,Lead,L00504,Teaching Demo
Arav,8606625068,SUB227,TCH108,2025-11-08,10:30,11:00,English,,https://meet.google.com/ane-ofwk-mvo,Converted to Sale,2025-11-09,DMO121,data.edstaq@gmail.com,2025-11-09 11:56,,,Ragil,4.5,Lead,L05506,Teaching Demo
KASHIFF,7593055194,SUB177,TCH101,2025-11-10,19:38,19:38,English,MALAYALAM,https://meet.google.com/bmq-dtks-sch,Rejected,2025-11-10,DMO122,data.edstaq@gmail.com,2026-02-08 12:19,,,Faris,,Lead,,Teaching Demo
Arjith,9061565066,SUB235,TCH105,2025-11-12,20:00,21:00,Malayalam,,https://meet.google.com/txd-eufr-rrf,Rejected,2025-11-12,DMO123,data.edstaq@gmail.com,2026-05-14 17:39,,Financial issues,Adnan,,Lead,L00718,Teaching Demo
Aashmi,8075845896,SUB239,TCH115,2025-11-16,19:00,20:00,English,,https://meet.google.com/dbe-ocqy-qrs,Follow up,2025-11-16,DMO124,data.edstaq@gmail.com,2025-11-18 09:40,For next year or next 8th class,,Ragil,,Lead,L01058,Teaching Demo
Alhad,7593004318,SUB177,TCH106,2025-11-20,20:00,21:00,Malayalam,,https://meet.google.com/ggb-wjma-zqe,Rejected,2025-11-19,DMO125,data.edstaq@gmail.com,2025-12-24 10:26,Ready to register tomorrow. They skipped the registration today due to network issue. But also they mentioned they want to ask their father,,Sinan M,,Lead,L00152,Teaching Demo
Badhi,9605056597,SUB136,TCH101,2025-11-20,19:30,20:30,English,MALAYAM,https://meet.google.com/ypd-fggj-epk,Converted to Sale,2025-11-21,DMO126,data.edstaq@gmail.com,2025-11-25 10:09,,reschedule,Ragil,4.7,Lead,L05507,Teaching Demo
niya,9605023977,SUB177,TCH106,2025-11-20,19:00,19:30,English,mixed,https://meet.google.com/oom-qvnv-nwg,Rejected,2025-11-20,DMO127,data.edstaq@gmail.com,2026-01-21 10:40,Not interested,,Sinan M,,Lead,L00226,Teaching Demo
Aaron Thomas,9207059960,SUB296,,2025-11-23,16:28,16:28,English,,http://www.ghfgh.jhgj,Rejected,2025-11-23,DMO128,data.edstaq@gmail.com,2026-05-14 17:39,Fund issue,,Adnan,,Lead,L03719,Teaching Demo
Aysha Nasha,8086930308,SUB228,TCH108,2025-12-09,19:30,20:30,English,,https://meet.google.com/vct-ygrk-xqn,Converted to Sale,2025-12-09,DMO129,data.edstaq@gmail.com,2025-12-17 13:56,They will inform tomorrow after asked their father. 80% chance to close,,Sinan M,,Lead,L05508,Teaching Demo
Baibee,8593937732,SUB239,TCH116,2025-11-23,18:00,19:00,English,,https://meet.google.com/buq-xmyd-nou,Rejected,2025-11-23,DMO130,data.edstaq@gmail.com,2026-01-20 18:44,Not interested,,Adnan,,Lead,L01309,Teaching Demo
abdul hadi.,8590495163,SUB299,TCH112,2025-12-05,19:30,20:30,English,,https://meet.google.com/gsm-rqfa-urt,Rejected,2025-12-05,DMO131,data.edstaq@gmail.com,2025-12-07 12:05,Abdul hadi not interested paraju team epo,,Adnan,,Lead,L00650,Teaching Demo
Jo George,9496347003,SUB172,TCH118,2025-12-07,15:00,16:00,English,English & Malayalam,https://meet.google.com/gsm-rqfa-urt,Rejected,2025-12-07,DMO132,data.edstaq@gmail.com,2026-01-20 18:44,"followup with fees details at 8 dec 7 pm evening they are ok with class and interested but they are enquired other home tution so the parent is withing for the home tution reply, not interested",,Faris,,Lead,L01133,Teaching Demo
Prarthana,8113884453,SUB251,TCH103,2025-12-12,19:00,20:00,English,Mixed eng and malayalam,https://meet.google.com/awt-jmcd-qnm,Converted to Sale,2025-12-12,DMO133,data.edstaq@gmail.com,2025-12-13 16:43,they are happy with the class,,Adnan,,Lead,L05509,Teaching Demo
Rayyan Abdullah,9946986468,SUB266,TCH119,2025-12-14,19:00,20:00,English,mixed,https://meet.google.com/kpr-ozwx-nrs,Rejected,2025-12-14,DMO134,data.edstaq@gmail.com,2026-05-14 14:09,,,Ragil,,Lead,L01589,Teaching Demo
Muhammed Rinshad,7736968469,SUB199,TCH101,2025-12-20,19:30,20:30,English,Malayalam,https://meet.google.com/hmr-vqig-ufz,Rejected,2025-12-17,DMO135,data.edstaq@gmail.com,2026-01-20 17:05,financial issues,Sana,Ragil,,Lead,L02102,Teaching Demo
aiza,7034002698,SUB272,TCH119,2025-12-21,16:05,16:05,Malayalam,mixed,https://meet.google.com/biy-gbkr-xpx,Converted to Sale,2025-12-21,DMO136,data.edstaq@gmail.com,2026-01-04 10:56,,,Ragil,,Lead,L05511,Teaching Demo
imran,9061124422,SUB124,TCH101,2025-12-21,19:00,19:15,English,,https://meet.google.com/nvp-toib-rac,Converted to Sale,2025-12-21,DMO137,data.edstaq@gmail.com,2026-01-04 10:56,start in jan 26,,Ragil,,Lead,L02242,Teaching Demo
inshas,9061124422,SUB239,TCH114,2025-12-21,19:00,19:15,English,,https://meet.google.com/szi-endr-eme,Converted to Sale,2025-12-21,DMO138,data.edstaq@gmail.com,2026-01-04 10:55,classed in jan,,Ragil,,Lead,L02242,Teaching Demo
fathima isha,9946624783,SUB275,TCH108,2025-12-22,19:00,20:00,English,,https://meet.google.com/pxq-epuo-cxa,Rejected,2025-12-21,DMO139,data.edstaq@gmail.com,2025-12-23 11:22,,,Adnan,,Lead,L02322,Teaching Demo
amna,8593849489,SUB137,TCH111,2025-12-26,20:00,20:20,English,,https://meet.google.com/hfv-fzdc-tni,Converted to Sale,2025-12-26,DMO140,data.edstaq@gmail.com,2026-01-04 10:34,,,Ragil,,Lead,L05512,Teaching Demo
Govind,9496046374,SUB227,TCH104,2025-12-28,19:30,20:30,English,,https://meet.google.com/pbb-gqfr-rbp,Rejected,2025-12-28,DMO141,data.edstaq@gmail.com,2026-01-18 16:12,Money,,Faris,,Lead,L01351,Teaching Demo
Manham,9656666794,SUB190,TCH101,2025-12-28,00:00,13:00,English,english,https://meet.google.com/ytb-cgix-pkb,Converted to Sale,2025-12-28,DMO142,data.edstaq@gmail.com,2025-12-31 15:54,,Mother +91 89436 21454,Adnan,,Lead,L00410,Teaching Demo
Shafna,7736620057,SUB223,TCH101,2025-12-30,17:30,18:30,Malayalam,malayalam or mixed,https://meet.google.com/vpi-hrvz-vgr,Rejected,2025-12-29,DMO143,data.edstaq@gmail.com,2026-01-18 16:06,They not need tution,,Faris,,Lead,L02091,Teaching Demo
mohammed ragil,9072819411,SUB325,,2025-12-29,19:30,20:30,English,,vhvv,Rejected,2025-05-14,DMO144,data.edstaq@gmail.com,2026-05-14 17:38,,,Adnan,,Lead,L02745,Teaching Demo
Mohammed Ragil,9072819411,SUB325,TCH108,2025-12-30,19:30,20:30,English,,https://meet.google.com/pbb-gqfr-rbp,Rejected,2025-12-30,DMO145,data.edstaq@gmail.com,2026-02-08 12:14,,,Faris,,Lead,L02745,Teaching Demo
Nehan mohhamud,7025841715,SUB181,TCH120,2025-12-31,19:00,20:00,English,mixed,https://meet.google.com/fpa-ybvw-cqn,Rejected,2025-12-31,DMO146,data.edstaq@gmail.com,2026-01-04 11:06,,,Faris,,Lead,L03010,Teaching Demo
"Hasan, Husain",‪+91 85899 81734‬,SUB275,TCH120,2026-01-02,19:30,20:00,English,Malayalam,https://meet.google.com/rpp-djyn-qtw,Rejected,2026-01-01,DMO147,data.edstaq@gmail.com,2026-05-14 17:39,,,Ragil,,Lead,,Teaching Demo
Ramzan,7510726966,SUB114,TCH105,2026-01-03,19:00,20:00,English,,https://meet.google.com/ghe-jmbz-opa,Rejected,2026-01-03,DMO148,data.edstaq@gmail.com,2026-05-14 17:38,,,Ragil,,Lead,L03188,Teaching Demo
Farsin,9605559529,SUB283,TCH121,2026-01-04,19:00,20:00,Malayalam,,https://meet.google.com/gva-pkze-erb,Follow up,2026-01-03,DMO149,data.edstaq@gmail.com,2026-02-08 12:18,,,Ragil,,Lead,L02895,Teaching Demo
Ajva,9562044591,SUB259,TCH108,2026-01-04,15:30,16:30,Malayalam,Malayalam,https://meet.google.com/iaa-ockh-trr,Rejected,2026-01-04,DMO150,data.edstaq@gmail.com,2026-02-08 12:18,,,Adnan,,Lead,L02892,Teaching Demo
Devika,9037620470,SUB275,TCH104,04/01/2026,15:30:00,16:00:00,English,Mixed,https://meet.google.com/zhr-wcqz-s,Rejected,04/01/2026,DMO151,data.edstaq@gmail.com,20/01/2026 10:21:55,Not interested,,Adnan,,Lead,L02985,Teaching Demo
Mohd Rayyan,8592831912,SUB180,TCH101,04/01/2026,19:30:00,20:30:00,Malayalam,Malayalam,https://meet.google.com/xri-bsfo-qok,Rejected,04/01/2026,DMO152,data.edstaq@gmail.com,14/05/2026 14:08:55,,Basics only,Ragil,,Lead,L03011,Teaching Demo
Nehal yusaff,7025841715,SUB283,TCH119,10/01/2026,18:30:00,19:00:00,Malayalam,Malayalam,https://meet.google.com/yos-baxa-enk,Rejected,10/01/2026,DMO153,data.edstaq@gmail.com,14/05/2026 14:09:32,,,Ragil,,Lead,L03010,Teaching Demo
Shanzan,7994104547,SUB122,TCH108,04/01/2026,09:30:00,10:30:00,Malayalam,Malayalam,https://meet.google.com/icg-xbfk-zrp,Rejected,04/01/2026,DMO154,data.edstaq@gmail.com,04/01/2026 10:18:17,,,Adnan,,Lead,L03142,Teaching Demo
Jiza Fathima,96056 10765,SUB259,TCH120,03/01/2026,20:30:00,21:00:00,Malayalam,Malayalam,https://meet.google.com/fmh-jzso-xpm,Rejected,03/01/2026,DMO155,data.edstaq@gmail.com,04/01/2026 10:31:37,joined in xylem,Sana lead,Adnan,,Lead,,Teaching Demo
Sanha,9633065065,SUB177,TCH110,06/01/2026,20:00:00,21:00:00,Malayalam,Mixed,https://meet.google.com/vob-yvnt-wns,Rejected,06/01/2026,DMO156,data.edstaq@gmail.com,08/02/2026 12:22:11,,,Adnan,,Lead,L03045,Teaching Demo
Mohd ragil,8157091755,SUB223,TCH121,06/01/2026,20:00:00,21:00:00,English,Mixed,https://meet.google.com/xmc-efmc-owu,Rejected,06/01/2026,DMO157,data.edstaq@gmail.com,08/02/2026 12:16:56,,,Adnan,,Lead,L03081,Teaching Demo
Mohd Ahil,9061860071,SUB111,TCH109,07/01/2026,19:30:00,20:30:00,English,mixed,https://meet.google.com/uaq-yart-keo,Follow up,07/01/2026,DMO158,data.edstaq@gmail.com,08/02/2026 12:17:37,Student response to teacher perfectly and teacher said that 95% chance to close,,Sinan M,,Lead,L03208,Teaching Demo
sikriya,8129541720,SUB191,TCH108,11/01/2026,15:00:00,15:30:00,English,mixed,https://meet.google.com/unv-duuv-ynf,Follow up,11/01/2026,DMO160,data.edstaq@gmail.com,08/02/2026 12:15:11,student is ok,,Adnan,,Lead,L01070,Teaching Demo
fathima Raja,6238575620,SUB304,TCH107,11/01/2026,14:00:00,15:30:00,Malayalam,malayalam,https://meet.google.com/eej-tdjs-gyk,Rejected,11/01/2026,DMO161,data.edstaq@gmail.com,08/02/2026 12:15:29,class is okok,,Adnan,,Lead,L00398,Teaching Demo
nebhan,9544193336,SUB200,,16/01/2026,11:00:00,12:00:00,Malayalam,mixed,hgfdhgdg,Follow up,11/01/2026,DMO162,data.edstaq@gmail.com,21/01/2026 15:18:14,Next Monday,,,,Lead,L03221,Teaching Demo
Shanzan,7994104547,SUB122,,11/01/2026,19:31:00,20:00:00,Malayalam,mixed,cgchg,Rejected,11/01/2026,DMO163,data.edstaq@gmail.com,14/05/2026 17:38:32,,,,,Lead,L03142,Teaching Demo
mohd Zayan,8943895387,SUB111,TCH105,23/01/2026,18:00:00,18:30:00,English,mixed,meet.google.com/fhj-rzwn-njc,Rejected,22/01/2026,DMO164,data.edstaq@gmail.com,08/02/2026 12:20:31,,Their phone was switched off,Adnan,2.5,Lead,L03059,Teaching Demo
Shreeya,9446837888,SUB318,,11/01/2026,11:30:00,12:00:00,English,english,ghdhgdg,Rejected,11/01/2026,DMO165,data.edstaq@gmail.com,08/02/2026 12:16:03,interested,faris doing demo as maths teacher,Faris,,Lead,L03235,Teaching Demo
Niya fathima,9048453694,SUB155,TCH124,03/04/2026,19:30:00,20:00:00,English,Mixed,https://meet.google.com/soc-vtqp-bia,Converted to Sale,13/01/2026,DMO166,data.edstaq@gmail.com,04/04/2026 16:03:47,,,Adnan,,Lead,L03067,Teaching Demo
Shahabas,8848790885,SUB270,TCH108,15/01/2026,20:30:00,21:20:00,English,Mixed,https://meet.google.com/deq-ioef-aev,Rejected,15/01/2026,DMO167,data.edstaq@gmail.com,21/01/2026 17:56:27,Not interested,,Adnan,,Lead,L03020,Teaching Demo
Navaneeth,9539107864,SUB310,TCH120,18/01/2026,14:11:00,14:11:00,Malayalam,Malayalam,https://meet.google.com/qbr-asgi-fdm,Rejected,18/01/2026,DMO168,data.edstaq@gmail.com,20/01/2026 10:16:29,Not interested,,Adnan,,Lead,L03297,Teaching Demo
Mohd shanid,9539133502,SUB111,TCH104,22/01/2026,20:00:00,20:30:00,English,Mixed,meet.google.com/hpd-tyom-rws,Follow up,22/01/2026,DMO170,sanasadik7356@gmail.com,22/01/2026 21:07:11,"Class is good They are not looking at it now, they will say after the madrasa exam,Time for vacation","It is a good lead, vacation time",,,Lead,L03061,Teaching Demo
Deva Krishna,7994958465,SUB236,TCH107,23/01/2026,18:00:00,18:30:00,Malayalam,Malayalam,meet.google.com/sov-yapy-zss,Scheduled,22/01/2026,DMO171,sanasadik7356@gmail.com,22/01/2026 15:30:33,,,,,Lead,L03467,Teaching Demo
Zara vineesh,8606393590,SUB146,TCH109,23/01/2026,19:00:00,19:30:00,English,English,meet.google.com/kbd-kcxs-oap,Rejected,22/01/2026,DMO172,sanasadik7356@gmail.com,23/01/2026 19:10:02,They said ok for the class and joined the class and then said no,Not interested lead,,,Lead,L03465,Teaching Demo
Amina rufaidha,9656253355,SUB275,TCH105,25/01/2026,18:00:00,18:30:00,English,Mixed,meet.google.com/biw-izos-abu,Converted to Sale,24/01/2026,DMO173,sanasadik7356@gmail.com,25/01/2026 19:05:16,They are okay to start class,"interested, hot lead",,3,Lead,L05513,Teaching Demo
Alvan malik,9747651083,SUB177,TCH105,25/01/2026,10:00:00,22:30:00,English,Mixed,meet.google.com/eyt-mgic-pjc,Rejected,24/01/2026,DMO174,sanasadik7356@gmail.com,08/02/2026 12:12:36,Finance issue,,,,Lead,,Teaching Demo
Advika,8606666800,SUB181,TCH105,28/01/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/tcr-wyki-dfh,Scheduled,27/01/2026,DMO175,sanasadik7356@gmail.com,28/01/2026 19:43:33,,,,,Lead,L03569,Teaching Demo
Aira,8113931637,SUB154,TCH108,29/01/2026,19:00:00,20:00:00,English,Mixed,https://meet.google.com/qdk-fsfg-vux,Converted to Sale,29/01/2026,DMO176,data.edstaq@gmail.com,03/02/2026 15:32:18,,,,,Lead,L05514,Teaching Demo
Binshad,8590222478,SUB275,TCH109,01/02/2026,14:00:00,14:30:00,English,Mixed,meet.google.com/czx-ctvs-wen,Rejected,01/02/2026,DMO177,sanasadik7356@gmail.com,05/02/2026 16:16:01,Not interested,,,,Lead,L03004,Teaching Demo
Ehan,9645130710,SUB172,TCH124,08/02/2026,16:00:00,04:30:00,English,English,meet.google.com/gfv-sjpk-smc,Rejected,08/02/2026,DMO178,fathimasanaedstaq@gmail.com,14/05/2026 14:08:38,,,,,Lead,L03707,Teaching Demo
Fathima Nishma,9961267288,SUB147,TCH114,13/02/2026,18:00:00,18:50:00,English,Mixed,https://meet.google.com/ipp-yziq-biw,Rejected,13/02/2026,DMO179,data.edstaq@gmail.com,14/05/2026 14:08:31,,,Adnan,,Lead,L02554,Teaching Demo
Izza fathima,7909162686,SUB276,TCH107,14/02/2026,20:30:00,21:00:00,English,Mixed,meet.google.com/ndj-ghvs-qie,Scheduled,14/02/2026,DMO180,fathimasanaedstaq@gmail.com,14/02/2026 14:09:51,,,,,Lead,L02580,Teaching Demo
Daya fathima,9744943353,SUB251,TCH124,15/02/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/mrx-jwkb-eia,Scheduled,14/02/2026,DMO181,fathimasanaedstaq@gmail.com,14/02/2026 16:47:17,,,,,Lead,L03713,Teaching Demo
Rasha Fathima,8547065745,SUB270,TCH124,17/02/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/pzg-wppb-dpp,Rejected,16/02/2026,DMO183,fathimasanaedstaq@gmail.com,18/02/2026 17:42:25,Financial issues,,,,Lead,L02870,Teaching Demo
Aaron Thomas,9207059960,SUB294,TCH122,19/02/2026,17:00:00,17:30:00,English,Mixed,meet.google.com/cmy-gdqa-kjb,Rejected,17/02/2026,DMO184,fathimasanaedstaq@gmail.com,13/05/2026 19:10:31,Financial issues,,,,Lead,L03719,Teaching Demo
Hadi,9895730093,SUB278,TCH124,20/02/2026,17:00:00,17:30:00,Malayalam,Mixed,meet.google.com/wgf-ivwb-pdv,Rejected,20/02/2026,DMO185,fathimasanaedstaq@gmail.com,14/05/2026 14:08:20,Ask their father and tell their reply,,,,Lead,L03721,Teaching Demo
Fayzan,9846376514,SUB263,,28/02/2026,20:00:00,20:30:00,English,Mixed,meet.google.com/oas-cikz-wwp,Scheduled,27/02/2026,DMO186,fathimasanaedstaq@gmail.com,27/02/2026 15:18:46,,,,,Lead,L03796,Teaching Demo
Abishek,9809348010,SUB251,,28/02/2026,19:30:00,20:00:00,Malayalam,Malayalam,meet.google.com/smu-ncbs-vew,Scheduled,27/02/2026,DMO187,fathimasanaedstaq@gmail.com,27/02/2026 15:15:15,,,,,Lead,L03794,Teaching Demo
Jaiba sherin,9947807715,SUB114,TCH101,28/02/2026,20:00:00,20:30:00,English,Mixed,meet.google.com/xrt-mptz-itc,Scheduled,27/02/2026,DMO188,fathimasanaedstaq@gmail.com,28/02/2026 15:47:02,,,,,Lead,L03824,Teaching Demo
Niya,9562296938,SUB198,TCH124,01/03/2026,19:00:00,19:30:00,English,Mixed,meet.google.com/zwv-fmpn-rut,Rejected,27/02/2026,DMO189,fathimasanaedstaq@gmail.com,14/05/2026 14:08:12,,,,,Lead,L00075,Teaching Demo
Anfal,9645137415,SUB271,TCH124,18/03/2026,14:00:00,14:30:00,Malayalam,Mixed,meet.google.com/boy-zqzk-ebh,Converted to Sale,18/03/2026,DMO190,fathimasanaedstaq@gmail.com,04/04/2026 16:03:57,,,,,Lead,L05516,Teaching Demo
Nishanth,9895824829,SUB299,TCH108,22/03/2026,14:00:00,14:30:00,Malayalam,Malayalam,meet.google.com/drs-ihys-mwj,Rejected,22/03/2026,DMO191,fathimasanaedstaq@gmail.com,14/05/2026 17:41:22,Not interested,,,,Lead,L04362,Teaching Demo
Rana,8893722288,SUB318,TCH130,12/04/2026,15:00:00,15:30:00,English,Mixed,meet.google.com/vay-rwfn-bfr,Converted to Sale,12/04/2026,DMO192,fathimasanaedstaq@gmail.com,12/04/2026 16:09:46,The class is starting from tomorrow,,,,Lead,L05518,Teaching Demo
Hamraz,+971 56 988 9742,SUB344,TCH107,24/04/2026,16:30:00,17:00:00,English,English,meet.google.com/qzh-ziwd-upz,Rejected,24/04/2026,DMO193,fathimasanaedstaq@gmail.com,30/04/2026 17:17:46,,,,,Lead,,Teaching Demo
Anurag,6238127891,SUB437,TCH134,24/05/2026,19:00:00,19:30:00,English,Mixed,meet.google.com/had-ndou-avi,Converted to Sale,23/05/2026,DMO194,fathimasanaedstaq@gmail.com,30/05/2026 12:37:58,,,,,Lead,22637f85,Teaching Demo
Irena Diya,9744800231,SUB124,TCH130,25/05/2026,12:15:00,12:45:00,English,Mixed,meet.google.com/ere-hfjf-emh,Converted to Sale,25/05/2026,DMO195,fathimasanaedstaq@gmail.com,30/05/2026 12:37:48,,,,,Lead,,Teaching Demo
Saifudheen,9497374757,SUB203,TCH126,01/06/2026,20:00:00,20:30:00,English,Mixed,meet.google.com/vog-xgvh-eak,Scheduled,30/05/2026,DMO196,fathimasanaedstaq@gmail.com,30/05/2026 12:38:29,,,,,Lead,L00324,Teaching Demo
Sana,9656505118,SUB275,TCH123,03/06/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/vsu-cptm-pij,Completed,03/06/2026,DMO197,fathimasanaedstaq@gmail.com,03/06/2026 20:45:54,Good class,,,,Lead,L02447,Teaching Demo
Farzan,9946500045,SUB399,TCH125,16/06/2026,19:00:00,19:30:00,English,Mixed,meet.google.com/bpr-iwhe-kqw,Rejected,05/06/2026,DMO198,fathimasanaedstaq@gmail.com,18/06/2026 16:55:15,,Not interested,,,Lead,cbf2a3e1,Teaching Demo
Abinav,9048896828,SUB247,TCH123,08/06/2026,20:30:00,21:00:00,Malayalam,Mixed,meet.google.com/iqd-rcwi-xbh,Rejected,05/06/2026,DMO199,fathimasanaedstaq@gmail.com,07/10/2026 10:24:35,,,,,Lead,L02099,Teaching Demo
Ayshah fadwa,6238658644,SUB318,TCH125,19/06/2026,19:00:00,19:30:00,English,Mixed,meet.google.com/nvm-fnyv-ggi,Converted to Sale,05/06/2026,DMO200,fathimasanaedstaq@gmail.com,22/06/2026 16:54:07,,,,,Lead,L05586,Teaching Demo
Shaza,8848040411,SUB275,TCH126,14/06/2026,16:00:00,16:30:00,English,Mixed,meet.google.com/nwa-zkcf-pvs,Converted to Sale,11/06/2026,DMO201,fathimasanaedstaq@gmail.com,14/06/2026 20:00:27,,,,,Lead,L05750,Teaching Demo
Shaza,96056 05829,SUB270,TCH131,18/06/2026,20:00:00,20:30:00,English,Mixed,meet.google.com/qsu-wcoy-ewa,Converted to Sale,18/06/2026,DMO202,fathimasanaedstaq@gmail.com,18/06/2026 20:49:30,,,,,Lead,,Teaching Demo
Ali & Ayisha,8086303016,SUB146,TCH138,20/06/2026,19:00:00,19:30:00,English,Mixed,meet.google.com/vgs-vbno-zqo,Completed,18/06/2026,DMO203,fathimasanaedstaq@gmail.com,21/06/2026 05:32:23,,,,,Lead,L05924,Teaching Demo
Al Rayyan,9746407579,SUB218,,19/06/2026,20:00:00,20:30:00,English,Mixed,meet.google.com/wpi-tuhn-wde,Rejected,18/06/2026,DMO204,fathimasanaedstaq@gmail.com,22/06/2026 16:53:42,,,,,Lead,L05869,Teaching Demo
Sanha vk,8606018361,SUB399,TCH103,20/06/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/ymr-nfih-tik,Converted to Sale,20/06/2026,DMO205,fathimasanaedstaq@gmail.com,22/06/2026 16:53:29,,,,,Lead,L05952,Teaching Demo
Hadi,9526126164,SUB155,TCH126,23/06/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/hqo-xfxq-uuh,Rejected,22/06/2026,DMO206,fathimasanaedstaq@gmail.com,26/06/2026 15:42:31,,,,,Lead,L06081,Teaching Demo
Ayisha thanvi,8943924258,SUB146,TCH101,26/06/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/puc-kogw-aqq,Completed,22/06/2026,DMO207,fathimasanaedstaq@gmail.com,26/06/2026 15:51:45,,,,,Lead,L06080,Teaching Demo
Mohammed Rifan,70124 88393,SUB224,TCH123,23/06/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/zzz-wfqr-yzz,Rejected,23/06/2026,DMO208,fathimasanaedstaq@gmail.com,26/06/2026 15:42:46,,,,,Lead,,Teaching Demo
Zahara,8593057494,SUB180,TCH101,27/06/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/bgc-mrts-wuy,Completed,26/06/2026,DMO209,fathimasanaedstaq@gmail.com,27/06/2026 20:38:52,,,,,Lead,L06082,Teaching Demo
Hiba Fathima,7909174028,SUB270,TCH131,27/06/2026,17:00:00,05:30:00,English,Mixed,meet.google.com/dop-sepe-gym,Scheduled,26/06/2026,DMO210,fathimasanaedstaq@gmail.com,27/06/2026 09:53:18,,,,,Lead,L06118,Teaching Demo
Sanha Vk,8606018361,SUB397,TCH123,29/06/2026,19:00:00,19:30:00,English,Mixed,meet.google.com/ozm-vhdm-ahc,Converted to Sale,28/06/2026,DMO211,fathimasanaedstaq@gmail.com,07/07/2026 20:07:05,,,,,Lead,L05952,Teaching Demo
Isha fathima,9645498607,SUB102,TCH101,30/06/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/vpj-rubm-mbx,Converted to Sale,30/06/2026,DMO212,fathimasanaedstaq@gmail.com,01/07/2026 17:01:31,,,,,Lead,L06123,Teaching Demo
Salman,9539157568,SUB274,TCH101,03/07/2026,19:30:00,20:00:00,Malayalam,Mixed,meet.google.com/mds-metv-smw,Completed,30/06/2026,DMO213,fathimasanaedstaq@gmail.com,04/07/2026 14:11:43,,,,,Lead,L06108,Teaching Demo
Sefin,8606321072,SUB275,TCH123,02/07/2026,20:00:00,20:30:00,Malayalam,Mixed,meet.google.com/cnp-vooz-vas,Converted to Sale,02/07/2026,DMO214,fathimasanaedstaq@gmail.com,27/09/2026 19:48:16,,,,,Lead,L06163,Teaching Demo
Jaseeka,8907294953,SUB266,TCH136,12/07/2026,11:00:00,11:30:00,English,Mixed,meet.google.com/ttd-mfsa-zpp,Completed,08/07/2026,DMO215,fathimasanaedstaq@gmail.com,12/07/2026 15:00:14,,,,,Lead,L06148,Teaching Demo
Shaza,9207671652,SUB226,TCH126,15/07/2026,19:00:00,19:30:00,English,Mixed,meet.google.com/nrz-eths-drd,Converted to Sale,15/07/2026,DMO216,fathimasanaedstaq@gmail.com,17/07/2026 12:06:28,,,,,Lead,9670b373,Teaching Demo
Shakikha,7025407071,SUB128,TCH123,16/07/2026,20:00:00,20:30:00,English,Mixed,meet.google.com/jge-ybtr-jbf,Converted to Sale,15/07/2026,DMO217,fathimasanaedstaq@gmail.com,17/07/2026 12:05:43,,,,,Lead,L06463,Teaching Demo
Muhyadinsha,9048043169,SUB298,TCH101,16/07/2026,20:00:00,20:30:00,English,Mixed,meet.google.com/ouc-woqk-xag,Converted to Sale,16/07/2026,DMO218,fathimasanaedstaq@gmail.com,17/07/2026 12:05:51,,,,,Lead,L06444,Teaching Demo
Fathima Hadiya,8590699297,SUB318,TCH125,17/07/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/xzi-apww-ztt,Completed,16/07/2026,DMO219,fathimasanaedstaq@gmail.com,18/07/2026 11:26:42,,,,,Lead,7adca175,Teaching Demo
Emin,7025459881,SUB111,TCH101,18/07/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/ayd-kpvi-wqt,Scheduled,18/07/2026,DMO220,fathimasanaedstaq@gmail.com,18/07/2026 11:29:03,,,,,Lead,L06535,Teaching Demo
Zidan,7025381325,SUB158,TCH101,22/07/2026,19:30:00,20:00:00,Malayalam,Mixed,meet.google.com/yms-acgx-tye,Completed,22/07/2026,DMO221,fathimasanaedstaq@gmail.com,24/07/2026 10:26:16,,,,,Lead,L06823,Teaching Demo
Azaan Mohammed,7907658669,SUB193,TCH136,25/07/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/daz-hjhd-muu,Scheduled,23/07/2026,DMO222,fathimasanaedstaq@gmail.com,25/07/2026 19:32:33,,,,,Lead,L06827,Teaching Demo
Ashitha,7907926002,SUB203,TCH136,24/07/2026,19:00:00,19:30:00,English,Mixed,meet.google.com/woz-aiva-suq,Completed,23/07/2026,DMO223,fathimasanaedstaq@gmail.com,24/07/2026 19:45:13,,,,,Lead,L06825,Teaching Demo
Sanha,7736793863,SUB248,TCH114,28/07/2026,19:30:00,20:00:00,Malayalam,Mixed,meet.google.com/fsg-xxmd-rki,Scheduled,24/07/2026,DMO224,fathimasanaedstaq@gmail.com,28/07/2026 19:08:03,,,,,Lead,L06711,Teaching Demo
Imran Mohammed,9745125482,SUB218,TCH136,31/07/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/wct-fxki-fkn,Completed,31/07/2026,DMO225,fathimasanaedstaq@gmail.com,01/08/2026 19:06:39,,,,,Lead,L06784,Teaching Demo
Chris,9562272469,SUB318,TCH125,31/07/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/jdf-fqhx-znq,Scheduled,31/07/2026,DMO226,fathimasanaedstaq@gmail.com,31/07/2026 19:35:55,,,,,Lead,L06757,Teaching Demo
Rishab,9895866806,SUB408,TCH132,01/08/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/owj-xiyz-kzd,Converted to Sale,01/08/2026,DMO227,fathimasanaedstaq@gmail.com,27/09/2026 19:47:53,,,,,Lead,65cad063,Teaching Demo
Diya,9048992898,SUB128,TCH136,02/08/2026,19:00:00,19:30:00,English,Mixed,meet.google.com/mjg-pvan-cnk,Scheduled,02/08/2026,DMO228,fathimasanaedstaq@gmail.com,02/08/2026 19:07:54,,,,,Lead,,Teaching Demo
Ajvad,7594990697,SUB367,TCH132,03/08/2026,19:45:00,20:15:00,English,Mixed,meet.google.com/mnf-htqp-yna,Converted to Sale,03/08/2026,DMO229,fathimasanaedstaq@gmail.com,27/09/2026 19:48:03,,,,,Lead,41406f4d,Teaching Demo
Mohammad ayyan,8606644552,SUB239,TCH114,09/08/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/jjr-cvat-ebv,Converted to Sale,09/08/2026,DMO230,fathimasanaedstaq@gmail.com,07/10/2026 10:25:38,,,,,Lead,L06495,Teaching Demo
Vaigha,9048489370,SUB329,,31/08/2026,19:30:00,20:00:00,Malayalam,Mixed,meet.google.com/xvw-ftab-vqg,Rejected,31/08/2026,DMO231,fathimasanaedstaq@gmail.com,07/10/2026 10:25:19,,Another tuition ready,,,Lead,907e9f57,Teaching Demo
Mihan,8606833467,SUB146,TCH101,01/09/2026,20:00:00,20:30:00,English,Mixed,meet.google.com/sbq-hsza-zgp,Converted to Sale,01/09/2026,DMO232,fathimasanaedstaq@gmail.com,27/09/2026 19:47:41,,,,,Lead,dd13ab55,Teaching Demo
Shazil,7510144048,SUB146,TCH101,27/09/2026,15:30:00,16:00:00,English,Mixed,meet.google.com/zxy-bnob-zfe,Rejected,25/09/2026,DMO233,fathimasanaedstaq@gmail.com,12/10/2026 15:16:45,,Offline interested,,,,,
Aysha aimy,9645577778,SUB191,,27/09/2026,20:30:00,21:00:00,English,Mixed,meet.google.com/xcb-uzrn-eka,Converted to Sale,27/09/2026,DMO234,fathimasanaedstaq@gmail.com,28/09/2026 19:14:29,,,,,,,
Mohammed afnan,7306453161,SUB324,TCH101,28/09/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/ujy-swim-ndj,Converted to Sale,28/09/2026,DMO235,fathimasanaedstaq@gmail.com,07/10/2026 10:24:04,,,,,,,
Iyzil,9072318191,SUB361,TCH139,28/09/2026,20:30:00,21:00:00,English,Mixed,https://meet.google.com/xcb-uzrn-eka,Completed,29/09/2026,DMO236,fathimasanaedstaq@gmail.com,29/09/2026 15:35:49,,,,,,,
Ayra,7356245331,SUB102,TCH101,07/10/2026,19:00:00,20:00:00,English,Mixed,meet.google.com/xeu-zncw-qmt,Rejected,06/10/2026,DMO237,fathimasanaedstaq@gmail.com,12/10/2026 15:16:08,,,,,,,
Fathima hessa,9048496158,SUB244,TCH108,07/10/2026,18:30:00,19:00:00,English,Mixed,meet.google.com/ywa-wcgh-nug,Rejected,06/10/2026,DMO238,fathimasanaedstaq@gmail.com,09/10/2026 14:51:52,,Payment issue,,,,,
Aysha shaza,9744258973,SUB176,TCH103,08/10/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/kqf-pyea-joa,Rejected,07/10/2026,DMO239,fathimasanaedstaq@gmail.com,12/10/2026 15:16:23,,Financial issues,,,,,
Fathima adila,9526406089,SUB158,TCH143,10/10/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/fqc-phhd-fxj,Converted to Sale,09/10/2026,DMO240,fathimasanaedstaq@gmail.com,12/10/2026 16:15:47,,,,,,,
Sinan,9207954896,SUB155,TCH140,12/10/2026,16:00:00,16:30:00,English,Mixed,meet.google.com/niy-gufc-ofi,Converted to Sale,09/10/2026,DMO241,fathimasanaedstaq@gmail.com,13/10/2026 16:33:38,,,,,,,
Raihan,8086531415,SUB168,TCH140,15/10/2026,19:00:00,19:30:00,English,Mixed,meet.google.com/dzm-skdq-xoi,Completed,09/10/2026,DMO242,fathimasanaedstaq@gmail.com,16/10/2026 12:43:20,,,,,,,
Jizan,8590833073,SUB124,TCH140,13/10/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/ich-ypiy-hkr,Rejected,10/10/2026,DMO243,fathimasanaedstaq@gmail.com,14/10/2026 13:28:43,,They can contact our team if needed,,,,,
Vignesh,9048168263,SUB396,TCH142,10/10/2026,20:00:00,20:30:00,English,Mixed,meet.google.com/jiv-fmoo-awg,Converted to Sale,10/10/2026,DMO244,fathimasanaedstaq@gmail.com,12/10/2026 15:05:29,,,,,,,
Siddarth,9207447884,SUB174,TCH141,16/10/2026,19:00:00,19:30:00,English,Mixed,meet.google.com/imp-pefv-nic,Completed,13/10/2026,DMO245,fathimasanaedstaq@gmail.com,16/10/2026 19:45:48,,,,,,,
Aaina,8111996669,SUB248,,14/10/2026,19:30:00,20:00:00,English,Mxed,meet.google.com/wgz-sjmz-reb,Rejected,13/10/2026,DMO246,fathimasanaedstaq@gmail.com,14/10/2026 13:26:37,,Not interested,,1,,,
Jivaniya,9544393620,SUB146,TCH143,18/10/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/qrj-vfxj-qqu,Scheduled,16/10/2026,DMO247,fathimasanaedstaq@gmail.com,18/10/2026 17:26:52,,,,,,,
Minha Fathima,9526514574,SUB168,,17/10/2026,19:30:00,20:00:00,English,Mixed,meet.google.com/djx-hhad-ttq,Rejected,16/10/2026,DMO248,fathimasanaedstaq@gmail.com,20/10/2026 12:41:57,,Not interested,,,,,
Faiz,9048039850,SUB147,,21/10/2026,20:30:00,21:00:00,English,Mixed,meet.google.com/kmn-zgbz-zvy,Scheduled,16/10/2026,DMO249,fathimasanaedstaq@gmail.com,16/10/2026 15:09:50,,,,,,,
Aamil,9656604433,SUB346,TCH142,18/10/2026,16:30:00,17:00:00,English,Mixed,meet.google.com/ywt-euwn-ncn,Converted to Sale,16/10/2026,DMO250,fathimasanaedstaq@gmail.com,20/10/2026 11:56:04,,,,,,,
Abdul muhyamin,9495729248,SUB133,TCH103,18/10/2026,20:30:00,21:00:00,English,Mixed,meet.google.com/wrw-qfhq-ksr,Scheduled,16/10/2026,DMO251,fathimasanaedstaq@gmail.com,20/10/2026 10:57:24,,,,,,,
Seyyfan Mohammad,7510766606,SUB271,,18/10/2026,20:00:00,20:30:00,English,Mixed,meet.google.com/vyt-uxyd-mfp,Scheduled,18/10/2026,DMO252,fathimasanaedstaq@gmail.com,18/10/2026 15:48:56,,,,,,,
"""

import io
reader = csv.DictReader(io.StringIO(csv_data.strip()))
rows = list(reader)

print(f"Total Demos: {len(rows)}")

# Metrics to calculate:
# 1. Total Requests / Demos
# 2. Status Breakdown (Converted to Sale, Rejected, Scheduled, Follow up, Completed)
# 3. Subject Demand Breakdown (Subject ID, Name, Grade/Stage, Board, Level, Count, Conversion Rate)
# 4. Class / Grade Demand Breakdown (LP, UP, HS, HSS / Class 1 to 10+, etc.)
# 5. Core Subject Family Demand Breakdown (Maths, Science, English, Malayalam, Social, Arabic, etc.)
# 6. Conversion Rate per Grade / Subject
# 7. Time slot preference / Teaching Language / Medium preference
# 8. Reasons for Rejection / Feedback summary

status_counter = Counter()
subject_counter = Counter()
subject_status = defaultdict(Counter)
stage_counter = Counter()
stage_status = defaultdict(Counter)
board_counter = Counter()
level_counter = Counter()
core_subject_counter = Counter()
core_subject_status = defaultdict(Counter)
rejection_reasons = []

for r in rows:
    status = (r.get("Demo Status") or "Unknown").strip()
    status_counter[status] += 1
    
    sub_id = (r.get("Subject ID") or "").strip()
    sub_info = subjects_map.get(sub_id, {
        "name": "Unknown Subject",
        "stage": "Unknown Grade",
        "board": "Unknown Board",
        "level": "Unknown Level",
        "label": sub_id or "Unassigned"
    })
    
    label = f"{sub_id} - {sub_info['label']}" if sub_info['label'] != sub_id else sub_id
    subject_counter[label] += 1
    subject_status[label][status] += 1
    
    stg = sub_info.get("stage") or "Unspecified"
    stage_counter[stg] += 1
    stage_status[stg][status] += 1
    
    brd = sub_info.get("board") or "Unspecified"
    board_counter[brd] += 1
    
    lvl = sub_info.get("level") or "Unspecified"
    level_counter[lvl] += 1
    
    # core subject name
    raw_name = sub_info.get("name") or "Other"
    core_name = raw_name.replace(" (MAL)", "").strip()
    core_subject_counter[core_name] += 1
    core_subject_status[core_name][status] += 1
    
    if status.lower() == "rejected":
        fb = (r.get("Feedback") or "").strip()
        note = (r.get("Note") or "").strip()
        if fb or note:
            rejection_reasons.append(f"{fb} | {note}".strip(" |"))

out = {
    "total": len(rows),
    "status": dict(status_counter),
    "stages": dict(stage_counter.most_common()),
    "stage_status": {k: dict(v) for k, v in stage_status.items()},
    "core_subjects": dict(core_subject_counter.most_common()),
    "core_subject_status": {k: dict(v) for k, v in core_subject_status.items()},
    "top_subjects": dict(subject_counter.most_common(20)),
    "boards": dict(board_counter),
    "levels": dict(level_counter),
    "rejection_sample": rejection_reasons[:15]
}

print(json.dumps(out, indent=2))
