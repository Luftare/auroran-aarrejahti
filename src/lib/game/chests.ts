// Treasure chest locations and the daily deterministic selection.
//
// All players see the same chests without a server: the day's chests are
// picked from predefined location slots by an algorithm seeded with the
// date. Same day → same seed → same selection on every device.
//
// The slots come in three levels ("areas") of widening range around the
// Träskändä manor park: puutarha → metsa → seutu. Each level has its own
// fully independent slot list with no shared positions — every location is
// marked separately per layer in /editori. A layer with no slots cannot be
// picked in the game.

import { distanceM } from '$lib/geo';

export type Slot = { id: string; lat: number; lng: number };
export type Chest = Slot & { looted: boolean };

export type LevelId = 'puutarha' | 'metsa' | 'seutu';
export const LEVELS: LevelId[] = ['puutarha', 'metsa', 'seutu'];

/* The per-level slot lists below are rewritten by the /editori save
   endpoint (vite.config.ts) — keep each block's shape intact. */

export const SLOTS_PUUTARHA: Slot[] = [
	{ id: 'puutarha-1', lat: 60.23671502503464, lng: 24.70864264190709 },
	{ id: 'puutarha-2', lat: 60.23673089948781, lng: 24.709194262707257 },
	{ id: 'puutarha-3', lat: 60.23683011464516, lng: 24.709086336898395 },
	{ id: 'puutarha-4', lat: 60.2368797221113, lng: 24.709458081350164 },
	{ id: 'puutarha-5', lat: 60.23701068546086, lng: 24.70963795769859 },
	{ id: 'puutarha-6', lat: 60.23719919239349, lng: 24.7103894411066 },
	{ id: 'puutarha-7', lat: 60.237289938916746, lng: 24.7099110257588 },
	{ id: 'puutarha-8', lat: 60.23717934960962, lng: 24.709490059368136 },
	{ id: 'puutarha-9', lat: 60.23653048395309, lng: 24.710225553768083 },
	{ id: 'puutarha-10', lat: 60.23610385274284, lng: 24.709893781836996 },
	{ id: 'puutarha-11', lat: 60.23564546604251, lng: 24.7094181088286 },
	{ id: 'puutarha-12', lat: 60.235625622317656, lng: 24.709989715889094 },
	{ id: 'puutarha-13', lat: 60.235893511589836, lng: 24.710425416375926 },
	{ id: 'puutarha-14', lat: 60.23569705967111, lng: 24.708418795785718 },
	{ id: 'puutarha-15', lat: 60.23600463538608, lng: 24.70810301286457 },
	{ id: 'puutarha-16', lat: 60.23634480357268, lng: 24.709220485904183 },
	{ id: 'puutarha-17', lat: 60.23632014553911, lng: 24.70823092493373 },
	{ id: 'puutarha-18', lat: 60.23614552394298, lng: 24.708918452307614 },
	{ id: 'puutarha-19', lat: 60.23632014553911, lng: 24.711572627750087 },
	{ id: 'puutarha-20', lat: 60.23685987913393, lng: 24.71120887780191 },
	{ id: 'puutarha-21', lat: 60.23578040305324, lng: 24.71125684482797 },
	{ id: 'puutarha-22', lat: 60.23547877837976, lng: 24.710317490567974 },
	{ id: 'puutarha-23', lat: 60.235323996219364, lng: 24.70870260068986 },
	{ id: 'puutarha-24', lat: 60.236457064094, lng: 24.708874482533787 },
	{ id: 'puutarha-25', lat: 60.236639538859805, lng: 24.70805493513356 },
	{ id: 'puutarha-26', lat: 60.235877554311685, lng: 24.709294083306702 },
	{ id: 'puutarha-27', lat: 60.235921210154885, lng: 24.708698492733618 },
	{ id: 'puutarha-28', lat: 60.23544496144808, lng: 24.708234811481105 },
	{ id: 'puutarha-29', lat: 60.235788258087325, lng: 24.711736404384595 },
	{ id: 'puutarha-30', lat: 60.23702794817186, lng: 24.709393120867816 },
	{ id: 'puutarha-31', lat: 60.236971632130775, lng: 24.710137917425243 },
	{ id: 'puutarha-32', lat: 60.23713323442402, lng: 24.710049133730166 },
	{ id: 'puutarha-33', lat: 60.23623216904525, lng: 24.708559540614146 },
	{ id: 'puutarha-34', lat: 60.235644504360664, lng: 24.709033053657606 },
	{ id: 'puutarha-35', lat: 60.23539964096483, lng: 24.709541093693332 },
	{ id: 'puutarha-36', lat: 60.23628848635735, lng: 24.71021190383857 },
	{ id: 'puutarha-37', lat: 60.23677085241354, lng: 24.709920890614057 },
	{ id: 'puutarha-38', lat: 60.23657007146619, lng: 24.71147460528809 },
	{ id: 'puutarha-39', lat: 60.2360020016327, lng: 24.711563388983166 },
	{ id: 'puutarha-40', lat: 60.23558818594168, lng: 24.710833389707545 }
];

export const SLOTS_METSA: Slot[] = [
	{ id: 'metsa-1', lat: 60.23507019973175, lng: 24.709555557167192 },
	{ id: 'metsa-2', lat: 60.234408902350054, lng: 24.708766668191004 },
	{ id: 'metsa-3', lat: 60.234755603612484, lng: 24.7083786900061 },
	{ id: 'metsa-4', lat: 60.23408466914643, lng: 24.706755647932738 },
	{ id: 'metsa-5', lat: 60.23386637171694, lng: 24.707479873878384 },
	{ id: 'metsa-6', lat: 60.233840689571025, lng: 24.708152369398363 },
	{ id: 'metsa-7', lat: 60.23403972567678, lng: 24.70941329849964 },
	{ id: 'metsa-8', lat: 60.23434148778989, lng: 24.71024098529361 },
	{ id: 'metsa-9', lat: 60.2341167715868, lng: 24.711269127483945 },
	{ id: 'metsa-10', lat: 60.23414566375655, lng: 24.712510657675608 },
	{ id: 'metsa-11', lat: 60.23452125964235, lng: 24.712025684945587 },
	{ id: 'metsa-12', lat: 60.23468176939187, lng: 24.711514847001297 },
	{ id: 'metsa-13', lat: 60.2349546341614, lng: 24.710874682995836 },
	{ id: 'metsa-14', lat: 60.23525959797951, lng: 24.712872770649142 },
	{ id: 'metsa-15', lat: 60.23572185351344, lng: 24.712006286035944 },
	{ id: 'metsa-16', lat: 60.23507019973175, lng: 24.710014664685872 },
	{ id: 'metsa-17', lat: 60.23326710280557, lng: 24.706945362433316 },
	{ id: 'metsa-18', lat: 60.23366973427645, lng: 24.706224479370235 },
	{ id: 'metsa-19', lat: 60.233621269639, lng: 24.708927790856848 },
	{ id: 'metsa-20', lat: 60.233460963020065, lng: 24.709746293501524 },
	{ id: 'metsa-21', lat: 60.23326710280557, lng: 24.709062956431126 },
	{ id: 'metsa-22', lat: 60.23284955383238, lng: 24.70994904186341 },
	{ id: 'metsa-23', lat: 60.23325761361113, lng: 24.710374198644587 },
	{ id: 'metsa-24', lat: 60.232918355377564, lng: 24.711590688813516 },
	{ id: 'metsa-25', lat: 60.23291462724555, lng: 24.71246175584838 },
	{ id: 'metsa-26', lat: 60.23311594576478, lng: 24.71394857716598 },
	{ id: 'metsa-27', lat: 60.23354094746648, lng: 24.713513043648987 },
	{ id: 'metsa-28', lat: 60.23327625407154, lng: 24.71443667507313 },
	{ id: 'metsa-29', lat: 60.23355585970663, lng: 24.715232650122516 },
	{ id: 'metsa-30', lat: 60.23360805249439, lng: 24.715690711235652 },
	{ id: 'metsa-31', lat: 60.2330003741738, lng: 24.71565316524294 },
	{ id: 'metsa-32', lat: 60.234148615762706, lng: 24.715788330817276 },
	{ id: 'metsa-33', lat: 60.23437229450667, lng: 24.71545792607975 },
	{ id: 'metsa-34', lat: 60.234909117262674, lng: 24.714511767059406 },
	{ id: 'metsa-35', lat: 60.2348457428119, lng: 24.71412879793175 },
	{ id: 'metsa-36', lat: 60.23462579523709, lng: 24.713115056124735 },
	{ id: 'metsa-37', lat: 60.23383173492829, lng: 24.712994908946968 },
	{ id: 'metsa-38', lat: 60.23325761361113, lng: 24.712844724976065 },
	{ id: 'metsa-39', lat: 60.23211331832428, lng: 24.711665780813064 },
	{ id: 'metsa-40', lat: 60.2314832425227, lng: 24.710614493012457 },
	{ id: 'metsa-41', lat: 60.231390035014556, lng: 24.711628234820296 },
	{ id: 'metsa-42', lat: 60.231401219929324, lng: 24.712213952309042 },
	{ id: 'metsa-43', lat: 60.23118497756357, lng: 24.712131351124924 },
	{ id: 'metsa-44', lat: 60.23034945940654, lng: 24.711590688828466 },
	{ id: 'metsa-45', lat: 60.23072602806761, lng: 24.712108823530457 },
	{ id: 'metsa-46', lat: 60.23129646542165, lng: 24.71068207580089 },
	{ id: 'metsa-47', lat: 60.2322753449715, lng: 24.710278066756388 },
	{ id: 'metsa-48', lat: 60.232566143664, lng: 24.710540888707158 },
	{ id: 'metsa-49', lat: 60.23208893419624, lng: 24.710946385430105 },
	{ id: 'metsa-50', lat: 60.233110452229965, lng: 24.71097642222412 },
	{ id: 'metsa-51', lat: 60.23516464684752, lng: 24.71184371848878 },
	{ id: 'metsa-52', lat: 60.234726333129544, lng: 24.709390170323644 },
	{ id: 'metsa-53', lat: 60.23430646922799, lng: 24.707828821491944 },
	{ id: 'metsa-54', lat: 60.232497763226235, lng: 24.705375273327803 },
	{ id: 'metsa-55', lat: 60.232986861941924, lng: 24.705709848077447 },
	{ id: 'metsa-56', lat: 60.23232703837081, lng: 24.70428790539094 },
	{ id: 'metsa-57', lat: 60.231990200236794, lng: 24.705031404834955 },
	{ id: 'metsa-58', lat: 60.23340674275178, lng: 24.708051871324983 },
	{ id: 'metsa-59', lat: 60.23322218042108, lng: 24.705979366625627 },
	{ id: 'metsa-60', lat: 60.232673101340936, lng: 24.70492917366161 },
	{ id: 'metsa-61', lat: 60.23469403609727, lng: 24.71013366976763 },
	{ id: 'metsa-62', lat: 60.234015791067776, lng: 24.707819527748683 },
	{ id: 'metsa-63', lat: 60.23404808876856, lng: 24.707094615791107 },
	{ id: 'metsa-64', lat: 60.23377125030106, lng: 24.70692732841627 },
	{ id: 'metsa-65', lat: 60.23278284508862, lng: 24.714876360476183 },
	{ id: 'metsa-66', lat: 60.23279255733635, lng: 24.714084086534456 },
	{ id: 'metsa-67', lat: 60.23220496117881, lng: 24.712704943007708 },
	{ id: 'metsa-68', lat: 60.23236521572122, lng: 24.71215719806034 },
	{ id: 'metsa-69', lat: 60.23287025521293, lng: 24.712861441563632 },
	{ id: 'metsa-70', lat: 60.23176304307751, lng: 24.712734286486437 },
	{ id: 'metsa-71', lat: 60.23129706451573, lng: 24.705337468508986 },
	{ id: 'metsa-72', lat: 60.23152096075631, lng: 24.705117236736726 }
];

export const SLOTS_SEUTU: Slot[] = [
	{ id: 'seutu-1', lat: 60.24568441474585, lng: 24.71077096390374 },
	{ id: 'seutu-2', lat: 60.23938894811013, lng: 24.713676485644527 },
	{ id: 'seutu-3', lat: 60.23588122570857, lng: 24.709301821155947 },
	{ id: 'seutu-4', lat: 60.23446495976461, lng: 24.70642378462594 },
	{ id: 'seutu-5', lat: 60.24602726815522, lng: 24.71872527336879 },
	{ id: 'seutu-6', lat: 60.24531169891034, lng: 24.717721311725654 },
	{ id: 'seutu-7', lat: 60.24518146019648, lng: 24.719151887504125 },
	{ id: 'seutu-8', lat: 60.24571316477295, lng: 24.716212215731645 },
	{ id: 'seutu-9', lat: 60.24737407043614, lng: 24.716785871444102 },
	{ id: 'seutu-10', lat: 60.24814021035908, lng: 24.715049766208352 },
	{ id: 'seutu-11', lat: 60.250372127538725, lng: 24.71583343338267 },
	{ id: 'seutu-12', lat: 60.25050143299916, lng: 24.71859076609846 },
	{ id: 'seutu-13', lat: 60.249891178633845, lng: 24.71942680279662 },
	{ id: 'seutu-14', lat: 60.24919365170936, lng: 24.724926491853353 },
	{ id: 'seutu-15', lat: 60.24977085068966, lng: 24.72608361511118 },
	{ id: 'seutu-16', lat: 60.246412644643186, lng: 24.73057030580921 },
	{ id: 'seutu-17', lat: 60.24393879012757, lng: 24.728345274089776 },
	{ id: 'seutu-18', lat: 60.24517745014256, lng: 24.729250093699363 },
	{ id: 'seutu-19', lat: 60.24169787746317, lng: 24.723622904948996 },
	{ id: 'seutu-20', lat: 60.24300398464325, lng: 24.726311657639485 },
	{ id: 'seutu-21', lat: 60.24041714368525, lng: 24.72066688012788 },
	{ id: 'seutu-22', lat: 60.24247372832883, lng: 24.718143076703313 },
	{ id: 'seutu-23', lat: 60.24441465689023, lng: 24.708230417937727 },
	{ id: 'seutu-24', lat: 60.24404019802819, lng: 24.71068802947076 },
	{ id: 'seutu-25', lat: 60.24398653049829, lng: 24.71161739133632 },
	{ id: 'seutu-26', lat: 60.24449583263228, lng: 24.71183925391307 },
	{ id: 'seutu-27', lat: 60.24446680997647, lng: 24.709300639403295 },
	{ id: 'seutu-28', lat: 60.24463895006653, lng: 24.710024495090607 },
	{ id: 'seutu-29', lat: 60.244958460867196, lng: 24.70750273791336 },
	{ id: 'seutu-30', lat: 60.24079896865993, lng: 24.70333339314203 },
	{ id: 'seutu-31', lat: 60.240977915580714, lng: 24.702265135547606 },
	{ id: 'seutu-32', lat: 60.23976571766647, lng: 24.701339837405442 },
	{ id: 'seutu-33', lat: 60.23897141287085, lng: 24.701709083369565 },
	{ id: 'seutu-34', lat: 60.2387971965986, lng: 24.702721047181427 },
	{ id: 'seutu-35', lat: 60.238233239739486, lng: 24.700816737526623 },
	{ id: 'seutu-36', lat: 60.23769025040107, lng: 24.699874967736093 },
	{ id: 'seutu-37', lat: 60.23662091016689, lng: 24.701280611963625 },
	{ id: 'seutu-38', lat: 60.235869017981514, lng: 24.70214314595927 },
	{ id: 'seutu-39', lat: 60.235834171501835, lng: 24.70310831375693 },
	{ id: 'seutu-40', lat: 60.23626846202734, lng: 24.704667389612155 },
	{ id: 'seutu-41', lat: 60.23702764951042, lng: 24.705483539196905 },
	{ id: 'seutu-42', lat: 60.23685751143313, lng: 24.70904382606483 },
	{ id: 'seutu-43', lat: 60.23744189377231, lng: 24.708093278082686 },
	{ id: 'seutu-44', lat: 60.23606097498208, lng: 24.708143692949363 },
	{ id: 'seutu-45', lat: 60.2363313225741, lng: 24.711559728851086 },
	{ id: 'seutu-46', lat: 60.23525874467791, lng: 24.712886794713768 },
	{ id: 'seutu-47', lat: 60.23495807491042, lng: 24.710861515539108 },
	{ id: 'seutu-48', lat: 60.23528076243272, lng: 24.70965513631245 },
	{ id: 'seutu-49', lat: 60.234876448373086, lng: 24.71431373620345 },
	{ id: 'seutu-50', lat: 60.23355233168732, lng: 24.713528036434326 },
	{ id: 'seutu-51', lat: 60.234185414376014, lng: 24.715809342135003 },
	{ id: 'seutu-52', lat: 60.23299474414142, lng: 24.715674803619294 },
	{ id: 'seutu-53', lat: 60.23313704603075, lng: 24.713949200589155 },
	{ id: 'seutu-54', lat: 60.232919173654324, lng: 24.71156596589222 },
	{ id: 'seutu-55', lat: 60.23341054126249, lng: 24.710184091169793 },
	{ id: 'seutu-56', lat: 60.233753475405535, lng: 24.708622580416005 },
	{ id: 'seutu-57', lat: 60.2340250602584, lng: 24.707830727391553 },
	{ id: 'seutu-58', lat: 60.23292252458171, lng: 24.705675295775876 },
	{ id: 'seutu-59', lat: 60.23372440403796, lng: 24.70504040841419 },
	{ id: 'seutu-60', lat: 60.2350308824478, lng: 24.70773573167142 },
	{ id: 'seutu-61', lat: 60.232294932905916, lng: 24.713876318340283 },
	{ id: 'seutu-62', lat: 60.23154801890354, lng: 24.714597468704397 },
	{ id: 'seutu-63', lat: 60.232038702612414, lng: 24.714460804265855 },
	{ id: 'seutu-64', lat: 60.231834608917296, lng: 24.71373914283879 },
	{ id: 'seutu-65', lat: 60.231069836364554, lng: 24.71557687427108 },
	{ id: 'seutu-66', lat: 60.230258161502974, lng: 24.711414906964364 },
	{ id: 'seutu-67', lat: 60.2312371850243, lng: 24.712170343504397 },
	{ id: 'seutu-68', lat: 60.23190712892864, lng: 24.70990980239742 },
	{ id: 'seutu-69', lat: 60.230781314542696, lng: 24.710718987471296 },
	{ id: 'seutu-70', lat: 60.23271851770616, lng: 24.70994613212821 },
	{ id: 'seutu-71', lat: 60.233808735428, lng: 24.7063972796459 },
	{ id: 'seutu-72', lat: 60.23704666085732, lng: 24.710393707963192 },
	{ id: 'seutu-73', lat: 60.235708448892154, lng: 24.711986992995634 },
	{ id: 'seutu-74', lat: 60.237790747369246, lng: 24.714158618554052 },
	{ id: 'seutu-75', lat: 60.23924413119684, lng: 24.716596741568253 },
	{ id: 'seutu-76', lat: 60.23926383552336, lng: 24.712713167769294 },
	{ id: 'seutu-77', lat: 60.23910670387042, lng: 24.713334328607317 },
	{ id: 'seutu-78', lat: 60.238525239994345, lng: 24.70845039307804 },
	{ id: 'seutu-79', lat: 60.23924665502298, lng: 24.703995600201836 },
	{ id: 'seutu-80', lat: 60.238319134112515, lng: 24.703829120483277 },
	{ id: 'seutu-81', lat: 60.242008763022085, lng: 24.712654851075797 },
	{ id: 'seutu-82', lat: 60.24268396098344, lng: 24.706918325339927 },
	{ id: 'seutu-83', lat: 60.24347302035821, lng: 24.70518815037053 },
	{ id: 'seutu-84', lat: 60.24259033059121, lng: 24.70282837387157 },
	{ id: 'seutu-85', lat: 60.24162784861207, lng: 24.704886609775713 },
	{ id: 'seutu-86', lat: 60.240498596790474, lng: 24.707264646484674 },
	{ id: 'seutu-87', lat: 60.24089946263035, lng: 24.71356589512311 },
	{ id: 'seutu-88', lat: 60.240007127100455, lng: 24.713329876008288 },
	{ id: 'seutu-89', lat: 60.24056225012248, lng: 24.712283798320072 },
	{ id: 'seutu-90', lat: 60.24156136839153, lng: 24.709999684447183 },
	{ id: 'seutu-91', lat: 60.2422152269647, lng: 24.71049000043348 },
	{ id: 'seutu-92', lat: 60.2433954285205, lng: 24.711655993714004 },
	{ id: 'seutu-93', lat: 60.24318853023706, lng: 24.714472627654402 },
	{ id: 'seutu-94', lat: 60.243329617648186, lng: 24.71267333008558 },
	{ id: 'seutu-95', lat: 60.24650090548775, lng: 24.713956890153355 },
	{ id: 'seutu-96', lat: 60.25121531456256, lng: 24.724173561467182 },
	{ id: 'seutu-97', lat: 60.250535427149146, lng: 24.72287442848858 },
	{ id: 'seutu-98', lat: 60.249812781003726, lng: 24.72057504803999 },
	{ id: 'seutu-99', lat: 60.24666885957802, lng: 24.7106860099816 },
	{ id: 'seutu-100', lat: 60.23434864489474, lng: 24.710264368512526 },
	{ id: 'seutu-101', lat: 60.234512266179564, lng: 24.711995529723595 },
	{ id: 'seutu-102', lat: 60.235957232344816, lng: 24.714022522709456 },
	{ id: 'seutu-103', lat: 60.237500167866045, lng: 24.71894119022363 },
	{ id: 'seutu-104', lat: 60.23678753578653, lng: 24.715341557519025 },
	{ id: 'seutu-105', lat: 60.24470698883161, lng: 24.715828914482813 },
	{ id: 'seutu-106', lat: 60.24910649250526, lng: 24.72955304562359 },
	{ id: 'seutu-107', lat: 60.243474346310194, lng: 24.718816027911856 },
	{ id: 'seutu-108', lat: 60.240637684224566, lng: 24.717305480744443 },
	{ id: 'seutu-109', lat: 60.24124765626544, lng: 24.718706255368886 },
	{ id: 'seutu-110', lat: 60.24260972955253, lng: 24.721923140653473 },
	{ id: 'seutu-111', lat: 60.24261511719911, lng: 24.721944850658872 },
	{ id: 'seutu-112', lat: 60.24147649353162, lng: 24.714190270040916 },
	{ id: 'seutu-113', lat: 60.24388232819595, lng: 24.713549006755812 },
	{ id: 'seutu-114', lat: 60.24549777596761, lng: 24.70789753129307 },
	{ id: 'seutu-115', lat: 60.23708525806367, lng: 24.709678068274798 },
	{ id: 'seutu-116', lat: 60.23645203413392, lng: 24.710260549389005 },
	{ id: 'seutu-117', lat: 60.23577365406021, lng: 24.70718914712566 },
	{ id: 'seutu-118', lat: 60.237088823933874, lng: 24.708850116545563 },
	{ id: 'seutu-119', lat: 60.236599430405164, lng: 24.70743044579112 },
	{ id: 'seutu-120', lat: 60.23551830092126, lng: 24.70813426924849 },
	{ id: 'seutu-121', lat: 60.23558615819911, lng: 24.71082725043763 },
	{ id: 'seutu-122', lat: 60.234628053842584, lng: 24.713143198610965 },
	{ id: 'seutu-123', lat: 60.23360717317007, lng: 24.71572561449861 }
];

export const SLOTS_BY_LEVEL: Record<LevelId, Slot[]> = {
	puutarha: SLOTS_PUUTARHA,
	metsa: SLOTS_METSA,
	seutu: SLOTS_SEUTU
};

/** The first level that has slots — a layer without marks cannot be played. */
export function defaultLevel(): LevelId {
	return LEVELS.find((level) => SLOTS_BY_LEVEL[level].length > 0) ?? 'seutu';
}

/** How many chests per day. */
export const DAILY_COUNT = 6;

/** "Far" = this fraction of the largest possible pairwise slot distance. */
const FAR_FRACTION = 0.7;

/** How many of the day's chests are drawn completely freely (allowed to cluster). */
const FREE_PICKS = DAILY_COUNT - 2;

/** How close you must walk to a chest (meters). */
export const LOOT_RADIUS_M = 10;

/** The game day rolls over at Helsinki midnight for all players. */
export function currentDay(now = new Date()): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Helsinki',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(now);
}

/** xmur3 hash: seed string → 32-bit seed. */
function seedFromDay(day: string): number {
	let h = 1779033703 ^ day.length;
	for (let i = 0; i < day.length; i++) {
		h = Math.imul(h ^ day.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	h = Math.imul(h ^ (h >>> 16), 2246822507);
	h = Math.imul(h ^ (h >>> 13), 3266489909);
	return (h ^= h >>> 16) >>> 0;
}

/** mulberry32: a fast deterministic pseudo-random generator. */
function mulberry32(seed: number): () => number {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** The largest possible pairwise slot distance (meters) — cached per level. */
const maxPairDistCache: Partial<Record<LevelId, number>> = {};
function maxPairDist(level: LevelId): number {
	let max = maxPairDistCache[level];
	if (max === undefined) {
		max = 0;
		const slots = SLOTS_BY_LEVEL[level];
		for (let i = 0; i < slots.length; i++) {
			for (let j = i + 1; j < slots.length; j++) {
				const d = distanceM(slots[i].lat, slots[i].lng, slots[j].lat, slots[j].lng);
				if (d > max) max = d;
			}
		}
		maxPairDistCache[level] = max;
	}
	return max;
}

function minDistTo(slot: Slot, group: Slot[]): number {
	let min = Infinity;
	for (const other of group) {
		const d = distanceM(slot.lat, slot.lng, other.lat, other.lng);
		if (d < min) min = d;
	}
	return min;
}

/**
 * The day's chest locations for a level, avoiding clustering: the first four
 * are drawn completely freely (they may land close together), but the last
 * two are forced far away from them — at least ~70% of the level's largest
 * possible pairwise distance. This way at least one chest pair is always far
 * apart, and all six never pile up in the same corner. If there are no
 * candidates far enough away (the free four already spread across the whole
 * area), the farthest ones available are taken.
 *
 * All picks use deterministic randomness seeded from the date and the level —
 * the same day gives the same locations to all players on the same level.
 */
export function dailySlots(day: string, level: LevelId): Slot[] {
	const rng = mulberry32(seedFromDay(day + ':' + level));
	const shuffled = [...SLOTS_BY_LEVEL[level]];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	if (shuffled.length <= DAILY_COUNT) return shuffled;

	const free = shuffled.slice(0, FREE_PICKS);
	const rest = shuffled.slice(FREE_PICKS);
	const farLimit = maxPairDist(level) * FAR_FRACTION;

	const picked = [...free];
	for (let n = 0; n < DAILY_COUNT - FREE_PICKS; n++) {
		const candidates = rest.filter((s) => !picked.includes(s) && minDistTo(s, free) >= farLimit);
		if (candidates.length > 0) {
			picked.push(candidates[Math.floor(rng() * candidates.length)]);
		} else {
			// None far enough — take the farthest remaining one
			let best: Slot | null = null;
			let bestDist = -1;
			for (const s of rest) {
				if (picked.includes(s)) continue;
				const d = minDistTo(s, free);
				if (d > bestDist) {
					bestDist = d;
					best = s;
				}
			}
			if (best) picked.push(best);
		}
	}
	return picked;
}
