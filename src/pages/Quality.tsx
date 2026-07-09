import { useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Leaf, 
  Sparkles, 
  UserCheck, 
  Award, 
  Flame, 
  PackageCheck, 
  HeartHandshake, 
  FileCheck2,
  CheckCircle2
} from 'lucide-react';
import { trackPageView } from '../utils';
import SafeImage from '../components/SafeImage';

export default function Quality() {
  useEffect(() => {
    trackPageView('/quality');
  }, []);

  const standards = [
    {
      title: 'Premium Ingredient Selection',
      desc: 'We form contractual links directly with vetted farming families in central and southern Tanzania. Every seed batch is physically sampled for dimensions, color homogeneity, and absolute lack of chemical fertilizer residual.',
      icon: Leaf,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      checks: [
        'Direct smallholder traceability',
        'Strict seed dimension parameters',
        'Pesticide & residue laboratory screenings',
        'No artificial colors or synthetics'
      ]
    },
    {
      title: 'State-of-the-Art Production Hygiene',
      desc: 'Our central processing line relies on automated physical hulling. Personnel enter using positive-pressure air showers, clad in surgical-grade hairnets, gloves, and sterile aprons. The physical contact with food products is strictly zero.',
      icon: Sparkles,
      color: 'bg-orange-50 text-orange-600 border-orange-100',
      checks: [
        'Hands-free automated hulling lines',
        'Daily deep chemical sterilization of equipment',
        'Positive air pressure filtration',
        'Surgical protective apparel mandates'
      ]
    },
    {
      title: 'Hermetic Packaging Standards',
      desc: 'Finished seeds and granola energy bars are encapsulated in thick multi-layered food-grade metallic pouch layers. This protective sealing creates a gas-tight hermetic block, blocking moisture entry and preserving crunchy freshness.',
      icon: PackageCheck,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      checks: [
        'Gas-tight multi-layer polymer bags',
        'Protective environment sealing systems',
        'Clear manufacturing & expiry timestamps',
        'Double heat seal durability checks'
      ]
    },
    {
      title: 'Proactive Customer Safety & TBS Compliance',
      desc: 'We are certified under local regulatory bodies (Tanzania Bureau of Standards - TBS). Our quality assurance lab maintains physical counter-samples of every batch produced for up to one year to guarantee security and trace wellness indicators.',
      icon: UserCheck,
      color: 'bg-red-50 text-red-600 border-red-100',
      checks: [
        'Full TBS (Tanzania Bureau of Standards) registration',
        'Retained physical sample archive indexing',
        'Rapid batch recall protocols in place',
        'Nutrition label integrity certification'
      ]
    }
  ];

  return (
    <div className="bg-white min-h-screen" id="quality-standards-page">
      {/* Header section */}
      <section className="relative py-16 bg-emerald-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage 
            src="" 
            alt="Laboratory quality testing" 
            placeholderText="Upload Quality Assurance Banner"
            className="w-full h-full object-cover opacity-15 filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 to-emerald-950" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-orange-400 text-xs font-bold uppercase tracking-widest bg-emerald-900 px-3.5 py-1.5 rounded-full border border-emerald-800 inline-block">
            NITA Hygiene Seal
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-sans">
            Our Quality Standards
          </h1>
          <p className="text-emerald-200/80 text-sm sm:text-base max-w-xl mx-auto">
            Review the systematic sanitization, sorting, and packaging standards that make our food products globally safe and trust-compliant.
          </p>
        </div>
      </section>

      {/* Main Core standards split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-emerald-700 text-xs font-bold uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">
            Sanitization Protocols
          </span>
          <h2 className="text-3xl font-extrabold text-emerald-950 font-sans tracking-tight">
            How We Maintain Food Integrity
          </h2>
          <p className="text-gray-500 text-sm">
            At NITA Food Products, quality control is a continuous circle rather than a final step. We execute daily physical tests from sorting to shipping.
          </p>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="space-y-16" id="quality-standards-grid">
          {standards.map((std, index) => {
            const Icon = std.icon;
            const isEven = index % 2 === 0;

            return (
              <div 
                key={index}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 items-center border-b border-gray-100 pb-16 last:border-0 last:pb-0 ${
                  isEven ? '' : 'lg:flex-row-reverse'
                }`}
              >
                
                {/* Text column */}
                <div className={`lg:col-span-7 space-y-5 text-left ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${std.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-emerald-950 font-sans tracking-tight">
                    {std.title}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    {std.desc}
                  </p>

                  {/* Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                    {std.checks.map((check, cIdx) => (
                      <div key={cIdx} className="flex items-center space-x-2 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{check}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conceptual illustration container */}
                <div className={`lg:col-span-5 bg-emerald-50/40 p-8 rounded-[32px] border border-emerald-100/30 text-left space-y-4 ${
                  isEven ? 'lg:order-2' : 'lg:order-1'
                }`}>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Protocol Verification
                  </span>
                  <div className="space-y-3.5">
                    <p className="text-xs font-bold text-emerald-950 font-sans uppercase tracking-wide">
                      Mandated Quality Checkpoints:
                    </p>
                    <ul className="space-y-3 text-xs text-gray-600">
                      <li className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                        <span>Visual optical-sorting to strip discolored or broken pieces.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                        <span>Controlled gentle dry-roasting ovens (retains healthy plant fats).</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                        <span>Moisture measurement below 4% to block fungal germination.</span>
                      </li>
                    </ul>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* Safety Certifications Banner */}
      <section className="py-20 bg-emerald-950 text-white px-4 md:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <FileCheck2 className="w-12 h-12 text-orange-400 mx-auto" />
          <h2 className="text-2xl sm:text-4xl font-extrabold font-sans tracking-tight">
            TBS certified. Nutritional excellence guaranteed.
          </h2>
          <p className="text-emerald-200/80 text-sm max-w-xl mx-auto">
            Our company operates in absolute synchronization with East African health directives and the Tanzania Bureau of Standards, supporting smallholder community livelihoods with integrity.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4 text-xs font-bold uppercase tracking-widest text-emerald-300">
            <span className="px-4 py-2 rounded-xl bg-emerald-900/50 border border-emerald-800">Moisture-Proof</span>
            <span className="px-4 py-2 rounded-xl bg-emerald-900/50 border border-emerald-800">Aseptic Sealing</span>
            <span className="px-4 py-2 rounded-xl bg-emerald-900/50 border border-emerald-800">TBS Certified</span>
          </div>
        </div>
      </section>
    </div>
  );
}
