import React, { useState, useEffect } from 'react';
import { CakeOrder, CakeShape, FillingType, SpongeType, SurfaceType, Location, CakeImage } from './types';
import { LOCATIONS, SHAPES, FILLINGS, SPONGES, SURFACES, CAKE_COLORS, ROUND_SIZES, SQUARE_SIZES, RECTANGLE_SIZES, HEART_SIZES, SHAVINGS_OPTIONS, DRIP_OPTIONS } from './constants';
import { Steps } from './components/Steps';
import { Calendar } from './components/Calendar';
import { analyzeCakeImage } from './services/geminiService';
import { Camera, MapPin, Calendar as CalendarIcon, Loader2, CheckCircle2, ChevronLeft, ChevronRight, Upload, X, Plus, Mail, Phone, User, Printer } from 'lucide-react';

const INITIAL_ORDER: CakeOrder = {
  tiers: 1,
  tierSizes: ["24"], // Default
  shape: CakeShape.ROUND,
  filling: FillingType.RASPBERRY,
  sponge: SpongeType.VANILLA,
  surface: SurfaceType.CREAM,
  inscription: '',
  specifications: '',
  quantity: 1,
  pickupDate: null,
  pickupLocationId: LOCATIONS[0].id,
  images: [],
  customerName: '',
  customerEmail: '',
  customerPhone: ''
};

export default function App() {
  const [step, setStep] = useState(1);
  const [order, setOrder] = useState<CakeOrder>(INITIAL_ORDER);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files.length > 0) {
        const newFiles: File[] = Array.from(e.target.files);
        const currentCount = order.images.length;
        const remainingSlots = 5 - currentCount;
        
        if (remainingSlots <= 0) return;

        const filesToProcess = newFiles.slice(0, remainingSlots);
        
        const newImages: CakeImage[] = filesToProcess.map(file => ({
          id: Math.random().toString(36).substring(7),
          file,
          previewUrl: URL.createObjectURL(file)
        }));

        setOrder(prev => ({ ...prev, images: [...prev.images, ...newImages] }));

        // Only analyze if it's the first batch and not already analyzing
        if (newImages.length > 0 && !isAnalyzing) {
          setIsAnalyzing(true);
          setAiAnalysisResult("Analyzuji obrázek...");
          
          try {
            const analysis = await analyzeCakeImage(newImages[0].file);
            
            if (analysis.suggestedShape) {
              handleShapeChange(analysis.suggestedShape);
            }
            if (analysis.suggestedColor) {
              // setOrder(prev => ({ ...prev })); 
            }
            if (analysis.description) {
              setAiAnalysisResult(analysis.description);
            }
          } catch (analysisError) {
            console.warn("AI analysis failed silently to not disrupt UX", analysisError);
            setAiAnalysisResult(null);
          } finally {
            setIsAnalyzing(false);
          }
        }
      }
    } catch (error) {
      console.error("Error handling file upload:", error);
      alert("Nepodařilo se nahrát obrázek. Zkuste to prosím znovu.");
    } finally {
      // Reset input value to allow re-uploading the same file if needed
      e.target.value = '';
    }
  };

  const handleEdiblePrintUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newImage: CakeImage = {
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl: URL.createObjectURL(file)
      };
      setOrder(prev => ({ ...prev, ediblePrintImage: newImage }));
      // Reset input
      e.target.value = '';
    }
  };

  const removeEdiblePrint = () => {
    if (order.ediblePrintImage) {
      URL.revokeObjectURL(order.ediblePrintImage.previewUrl);
      setOrder(prev => ({ ...prev, ediblePrintImage: undefined }));
    }
  };

  const removeImage = (idToRemove: string) => {
    setOrder(prev => {
      const imageToRemove = prev.images.find(img => img.id === idToRemove);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return {
        ...prev,
        images: prev.images.filter(img => img.id !== idToRemove)
      };
    });
    
    if (order.images.length <= 1) { 
       setAiAnalysisResult(null);
    }
  };

  const updateOrder = (updates: Partial<CakeOrder>) => {
    setOrder(prev => ({ ...prev, ...updates }));
  };

  // Logic to get available sizes based on shape
  const getSizesForShape = (shape: CakeShape) => {
    switch (shape) {
      case CakeShape.ROUND: return ROUND_SIZES;
      case CakeShape.SQUARE: return SQUARE_SIZES;
      case CakeShape.RECTANGLE: return RECTANGLE_SIZES;
      case CakeShape.HEART: return HEART_SIZES;
      default: return ROUND_SIZES;
    }
  };

  // Logic to handle shape change (resets sizes to avoid invalid states)
  const handleShapeChange = (shape: CakeShape) => {
    const defaultSize = getSizesForShape(shape)[0];
    const newTierSizes = Array(order.tiers).fill(defaultSize);
    
    // For tiered logic, we should try to pre-fill cascading sizes if possible, 
    // but simpler to just set defaults and let user fix
    if (order.tiers > 1 && shape !== CakeShape.RECTANGLE) {
       // Try to set descending defaults
       const available = getSizesForShape(shape);
       for(let i=0; i<order.tiers; i++) {
         if (i < available.length) newTierSizes[i] = available[i];
       }
    }

    setOrder(prev => ({ 
      ...prev, 
      shape, 
      tierSizes: newTierSizes,
      customSizeNote: '' // Reset custom note
    }));
  };

  const handleTierCountChange = (count: 1 | 2 | 3) => {
    const currentSizes = [...order.tierSizes];
    const available = getSizesForShape(order.shape);
    
    // Adjust array size
    if (count > currentSizes.length) {
       // Adding tiers: Attempt to find a smaller size than the last one
       while(currentSizes.length < count) {
         const lastSize = currentSizes[currentSizes.length - 1];
         const lastIndex = available.indexOf(lastSize);
         // If possible, pick next smaller size, else repeat last (user will change it)
         const nextSize = (lastIndex !== -1 && lastIndex + 1 < available.length) 
            ? available[lastIndex + 1] 
            : available[available.length - 1];
         currentSizes.push(nextSize);
       }
    } else {
       currentSizes.length = count;
    }
    updateOrder({ tiers: count, tierSizes: currentSizes });
  };

  const handleSizeChange = (tierIndex: number, newVal: string) => {
    const newSizes = [...order.tierSizes];
    newSizes[tierIndex] = newVal;
    
    // Auto-adjust lower tiers if they become invalid (larger than upper tier)
    // Only applies to Round/Square/Heart where strictly "Smaller" logic applies
    if (order.shape !== CakeShape.RECTANGLE) {
        const available = getSizesForShape(order.shape);
        for (let i = tierIndex + 1; i < newSizes.length; i++) {
            const prevSizeVal = parseInt(newSizes[i-1]);
            const currSizeVal = parseInt(newSizes[i]);
            
            if (!isNaN(prevSizeVal) && !isNaN(currSizeVal) && currSizeVal >= prevSizeVal) {
                // Find first smaller option
                const prevIndexInList = available.indexOf(newSizes[i-1]);
                if (prevIndexInList !== -1 && prevIndexInList + 1 < available.length) {
                    newSizes[i] = available[prevIndexInList + 1];
                }
            }
        }
    }

    updateOrder({ tierSizes: newSizes });
  };

  const getAvailableOptionsForTier = (tierIndex: number) => {
    const allSizes = getSizesForShape(order.shape);
    if (tierIndex === 0) return allSizes; // Bottom tier - all options
    
    if (order.shape === CakeShape.RECTANGLE) return allSizes; // Rectangle logic is looser usually

    // For Round/Square/Heart: must be smaller than the tier above it (index - 1)
    const sizeAbove = parseInt(order.tierSizes[tierIndex - 1]);
    if (isNaN(sizeAbove)) return allSizes;

    return allSizes.filter(s => parseInt(s) < sizeAbove);
  };

  const validateStep = (currentStepNum: number) => {
    if (currentStepNum === 2) {
        if (!order.filling) return { valid: false, msg: "Vyberte prosím náplň." };
        if (!order.sponge) return { valid: false, msg: "Vyberte prosím korpus." };
        if (!order.surface) return { valid: false, msg: "Vyberte prosím povrchovou úpravu." };

        if (order.surface === SurfaceType.MARZIPAN && !order.marzipanColor) return { valid: false, msg: "Vyberte prosím barvu marcipánu." };
        if (order.surface === SurfaceType.CREAM && !order.creamColor) return { valid: false, msg: "Vyberte prosím barvu krému." };
        if (order.surface === SurfaceType.CREAM_DRIP && (!order.creamColor || !order.dripType)) return { valid: false, msg: "Vyberte prosím barvu krému a druh stékání." };
        if (order.surface === SurfaceType.CHOCO_SHAVINGS && !order.shavingsType) return { valid: false, msg: "Vyberte prosím barvu hoblin." };
        if (order.surface === SurfaceType.EDIBLE_PRINT && !order.ediblePrintImage) return { valid: false, msg: "Pro pokračování musíte nahrát obrázek pro tisk." };
    }

    if (currentStepNum === 4 && !order.pickupDate) return { valid: false, msg: "Vyberte prosím datum vyzvednutí." };
    return { valid: true };
  };

  const nextStep = () => {
    const validation = validateStep(step);
    if (validation.valid) {
      setStep(s => Math.min(s + 1, 5));
    } else {
      alert(validation.msg);
    }
  };
  
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const selectedLocation = LOCATIONS.find(l => l.id === order.pickupLocationId);

  // Helper to find hex for a color name
  const getColorHex = (name?: string) => {
    if (!name) return 'transparent';
    const c = CAKE_COLORS.find(c => c.name === name);
    return c ? c.hex : 'transparent';
  };

  const handleSubmitOrder = () => {
    if (!order.customerEmail || !order.customerName || !order.customerPhone) {
        alert("Vyplňte prosím všechny kontaktní údaje (Jméno, Telefon, Email), abychom vás mohli kontaktovat.");
        return;
    }

    let surfaceDetails: string = order.surface;
    if (order.surface === SurfaceType.MARZIPAN) surfaceDetails += ` (Barva: ${order.marzipanColor || 'Neuvedeno'})`;
    if (order.surface === SurfaceType.CREAM) surfaceDetails += ` (Barva: ${order.creamColor || 'Neuvedeno'})`;
    if (order.surface === SurfaceType.CREAM_DRIP) surfaceDetails += ` (Krém: ${order.creamColor || 'Neuvedeno'}, Stékání: ${order.dripType || 'Neuvedeno'})`;
    if (order.surface === SurfaceType.CHOCO_SHAVINGS) surfaceDetails += ` (Typ: ${order.shavingsType || 'Neuvedeno'})`;
    if (order.surface === SurfaceType.EDIBLE_PRINT) surfaceDetails += ` (POZOR: Obrázek pro tisk zákazník zašle v odpovědi na tento email)`;
    if (order.surface === SurfaceType.OTHER) surfaceDetails += ` (Pozn: ${order.surfaceOtherNote})`;

    const subject = `Poptávka dortu - ${order.customerName}`;
    const body = `
NOVÁ POPTÁVKA DORTU
---------------------
Zákazník: ${order.customerName}
Telefon: ${order.customerPhone}
Email: ${order.customerEmail}

Datum vyzvednutí: ${order.pickupDate ? order.pickupDate.toLocaleDateString('cs-CZ') : 'Nevybráno'}
Místo: ${LOCATIONS.find(l => l.id === order.pickupLocationId)?.name}

DORT
----
Tvar: ${order.shape}
Patra: ${order.tiers}
Rozměry: ${order.tierSizes.join(' / ')} cm ${order.customSizeNote ? `(Pozn: ${order.customSizeNote})` : ''}

Korpus: ${order.sponge}
Náplň: ${order.filling}
Povrch: ${surfaceDetails}
${order.surface === SurfaceType.EDIBLE_PRINT ? '\n!!! DŮLEŽITÉ !!!\nZákazník zvolil jedlý tisk. Pokud není obrázek přiložen v odpovědi, prosím vyžádejte si ho.' : ''}

Nápis: ${order.inscription}
Množství: ${order.quantity} ks

Poznámky:
${order.specifications}
    `;

    const mailtoLink = `mailto:cukrarna.pist@seznam.cz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  // Render Functions
  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100">
        <h2 className="text-2xl font-serif text-brand-900 mb-4 flex items-center">
          <Camera className="mr-2 text-brand-500" /> Předloha
        </h2>
        
        {/* Image Upload Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-gray-700">Fotografie předlohy</label>
            <span className="text-xs text-gray-500 font-medium">Nahráno {order.images.length}/5</span>
          </div>
          
          <div className="space-y-4">
            {order.images.length === 0 ? (
              <div className="mt-1">
                <label 
                  htmlFor="main-file-upload" 
                  className="flex flex-col justify-center px-6 pt-10 pb-10 border-2 border-brand-200 border-dashed rounded-xl hover:bg-brand-50 transition-colors cursor-pointer group w-full"
                >
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-brand-400 group-hover:scale-110 transition-transform" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <span className="relative font-medium text-brand-600 hover:text-brand-500">
                        Nahrát fotografie
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG do 10MB (Max 5 souborů)</p>
                  </div>
                  <input 
                    id="main-file-upload" 
                    type="file" 
                    className="sr-only" 
                    accept="image/*" 
                    multiple
                    onChange={handleFileChange} 
                  />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {order.images.map((img) => (
                  <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-100">
                    <img src={img.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.preventDefault(); removeImage(img.id); }}
                      className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 text-gray-500 shadow-sm hover:text-red-500 hover:bg-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {order.images.length < 5 && (
                   <label className="border-2 border-brand-200 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-brand-50 transition-colors aspect-square text-brand-400 hover:text-brand-600">
                      <Plus size={32} />
                      <span className="text-xs font-bold mt-2">Přidat další</span>
                      <input type="file" className="sr-only" accept="image/*" multiple onChange={handleFileChange} />
                   </label>
                )}
              </div>
            )}
          </div>
          
          {isAnalyzing && (
            <div className="mt-4 flex items-center justify-center text-brand-600 bg-brand-50 p-3 rounded-lg">
              <Loader2 className="animate-spin mr-2 h-5 w-5" /> Umělá inteligence analyzuje váš dort...
            </div>
          )}
          
          {aiAnalysisResult && !isAnalyzing && order.images.length > 0 && (
            <div className="mt-4 bg-gradient-to-r from-brand-50 to-white p-4 rounded-lg border border-brand-100">
               <p className="text-brand-800 italic font-serif text-center">"{aiAnalysisResult}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Shape and Dimensions Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100">
         <h2 className="text-2xl font-serif text-brand-900 mb-6">Tvar a Velikost</h2>
         
         <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">Tvar dortu</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SHAPES.map((shape) => (
              <button
                key={shape}
                onClick={() => handleShapeChange(shape)}
                className={`py-3 px-2 rounded-xl border text-sm font-medium transition-all ${
                  order.shape === shape
                    ? 'bg-brand-600 text-white shadow-md border-brand-600 transform scale-105'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                }`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Počet pater</label>
            <div className="flex space-x-2">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => handleTierCountChange(num as 1|2|3)}
                  className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all ${
                    order.tiers === num 
                      ? 'border-brand-500 bg-brand-50 text-brand-700' 
                      : 'border-gray-200 text-gray-500 hover:border-brand-200'
                  }`}
                >
                  {num} {num === 1 ? 'patro' : num < 5 ? 'patra' : 'pater'}
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">
               {order.shape === CakeShape.ROUND ? 'Průměry (cm)' : order.shape === CakeShape.SQUARE ? 'Šířka (cm)' : order.shape === CakeShape.HEART ? 'Velikost (cm)' : 'Rozměry (cm)'}
             </label>
             <div className="space-y-3">
               {order.tierSizes.map((size, idx) => {
                 const availableOptions = getAvailableOptionsForTier(idx);
                 const isRectangleCustom = order.shape === CakeShape.RECTANGLE && size === 'Jiné';

                 return (
                   <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                     <div className="flex items-center justify-between mb-1">
                       <span className="text-sm text-gray-800 font-bold">
                         {idx === 0 ? '1. patro (spodní)' : `${idx + 1}. patro (menší)`}
                       </span>
                     </div>
                     <select 
                        value={size} 
                        onChange={(e) => handleSizeChange(idx, e.target.value)}
                        className="w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2.5"
                      >
                        {availableOptions.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                     
                     {/* Custom Input for Rectangle */}
                     {isRectangleCustom && (
                       <div className="mt-2 animate-fade-in">
                          <input 
                            type="text" 
                            placeholder="Např. 50x30 (Max 60x40)"
                            value={order.customSizeNote || ''}
                            onChange={(e) => updateOrder({ customSizeNote: e.target.value })}
                            className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-brand-500 focus:border-brand-500"
                          />
                          <p className="text-xs text-brand-600 mt-1">Maximální rozměr je 60x40 cm.</p>
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100">
        <h2 className="text-2xl font-serif text-brand-900 mb-6">Příchuť a Povrch</h2>

        {/* Filling & Sponge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Náplň</label>
            <select
              value={order.filling}
              onChange={(e) => updateOrder({ filling: e.target.value as FillingType })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50"
            >
              {FILLINGS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Korpus</label>
            <select
              value={order.sponge}
              onChange={(e) => updateOrder({ sponge: e.target.value as SpongeType })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50"
            >
              {SPONGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Surface */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">Povrchová úprava</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {SURFACES.map(surface => (
               <label key={surface} className={`
                  flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                  ${order.surface === surface ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500' : 'hover:bg-gray-50 border-gray-200'}
               `}>
                 <input 
                    type="radio" 
                    name="surface" 
                    value={surface} 
                    checked={order.surface === surface}
                    onChange={() => updateOrder({ surface })}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300"
                 />
                 <span className="ml-2 text-sm text-gray-700">{surface}</span>
               </label>
             ))}
          </div>

          {/* Conditional: Marzipan Color */}
          {order.surface === SurfaceType.MARZIPAN && (
            <div className="mt-4 p-4 bg-brand-50 rounded-lg border border-brand-100 animate-fade-in">
              <label className="block text-sm font-bold text-gray-700 mb-2">Vyberte barvu marcipánu *</label>
              <div className="flex flex-wrap gap-2">
                {CAKE_COLORS.map(color => (
                  <button
                    key={color.name}
                    onClick={() => updateOrder({ marzipanColor: color.name })}
                    className={`w-10 h-10 rounded-full border-2 shadow-sm transition-transform hover:scale-105 flex items-center justify-center ${
                      order.marzipanColor === color.name ? 'border-gray-800 scale-110 ring-2 ring-white' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                     {/* Show checkmark if selected for accessibility/clarity */}
                     {order.marzipanColor === color.name && (
                       <span className={`text-xs font-bold ${['Bílá', 'Žlutá'].includes(color.name) ? 'text-black' : 'text-white'}`}>✓</span>
                     )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-brand-800 font-medium">
                 Vybráno: {order.marzipanColor || <span className="text-gray-400 italic">Nevybráno</span>}
              </p>
            </div>
          )}

          {/* Conditional: Cream Color */}
          {(order.surface === SurfaceType.CREAM || order.surface === SurfaceType.CREAM_DRIP) && (
            <div className="mt-4 p-4 bg-brand-50 rounded-lg border border-brand-100 animate-fade-in">
              <label className="block text-sm font-bold text-gray-700 mb-2">Vyberte barvu krému *</label>
              <div className="flex flex-wrap gap-2">
                {CAKE_COLORS.map(color => (
                  <button
                    key={color.name}
                    onClick={() => updateOrder({ creamColor: color.name })}
                    className={`w-10 h-10 rounded-full border-2 shadow-sm transition-transform hover:scale-105 flex items-center justify-center ${
                      order.creamColor === color.name ? 'border-gray-800 scale-110 ring-2 ring-white' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                     {order.creamColor === color.name && (
                       <span className={`text-xs font-bold ${['Bílá', 'Žlutá'].includes(color.name) ? 'text-black' : 'text-white'}`}>✓</span>
                     )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-brand-800 font-medium">
                 Vybráno: {order.creamColor || <span className="text-gray-400 italic">Nevybráno</span>}
              </p>
            </div>
          )}
          
          {/* Conditional: Drip Type */}
          {order.surface === SurfaceType.CREAM_DRIP && (
            <div className="mt-2 p-4 bg-brand-50 rounded-lg border border-brand-100 animate-fade-in">
              <label className="block text-sm font-bold text-gray-700 mb-2">Druh stékané čokolády *</label>
              <div className="flex gap-4">
                 {DRIP_OPTIONS.map(opt => (
                    <label key={opt} className="flex items-center cursor-pointer">
                       <input 
                         type="radio" 
                         name="dripType" 
                         value={opt}
                         checked={order.dripType === opt}
                         onChange={() => updateOrder({ dripType: opt })}
                         className="text-brand-600 focus:ring-brand-500"
                       />
                       <span className="ml-2 text-sm text-gray-700">{opt}</span>
                    </label>
                 ))}
              </div>
            </div>
          )}

          {/* Conditional: Shavings Type */}
          {order.surface === SurfaceType.CHOCO_SHAVINGS && (
            <div className="mt-4 p-4 bg-brand-50 rounded-lg border border-brand-100 animate-fade-in">
              <label className="block text-sm font-bold text-gray-700 mb-2">Barva čoko-hoblin *</label>
              <div className="flex gap-4">
                 {SHAVINGS_OPTIONS.map(opt => (
                    <label key={opt} className="flex items-center cursor-pointer">
                       <input 
                         type="radio" 
                         name="shavingsType" 
                         value={opt}
                         checked={order.shavingsType === opt}
                         onChange={() => updateOrder({ shavingsType: opt })}
                         className="text-brand-600 focus:ring-brand-500"
                       />
                       <span className="ml-2 text-sm text-gray-700">{opt}</span>
                    </label>
                 ))}
              </div>
            </div>
          )}

          {/* Conditional: Edible Print Upload */}
          {order.surface === SurfaceType.EDIBLE_PRINT && (
            <div className="mt-4 p-4 bg-brand-50 rounded-lg border border-brand-100 animate-fade-in">
               <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Printer className="w-4 h-4 mr-2" /> Nahrajte obrázek pro tisk *
               </label>
               
               {!order.ediblePrintImage ? (
                 <>
                   <label className="border-2 border-brand-200 border-dashed rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-white transition-colors bg-white">
                      <Upload className="h-8 w-8 text-brand-400 mb-2" />
                      <span className="text-sm font-medium text-brand-600">Vybrat soubor</span>
                      <span className="text-xs text-gray-400 mt-1">JPG, PNG</span>
                      <input type="file" className="sr-only" accept="image/*" onChange={handleEdiblePrintUpload} />
                   </label>
                   <p className="text-xs text-red-500 mt-2 font-medium">Pro pokračování je nutné nahrát obrázek.</p>
                 </>
               ) : (
                 <div className="relative group aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white">
                    <img src={order.ediblePrintImage.previewUrl} alt="Edible print" className="w-full h-full object-contain" />
                    <button 
                      onClick={(e) => { e.preventDefault(); removeEdiblePrint(); }}
                      className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 text-gray-500 shadow-sm hover:text-red-500 hover:bg-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                 </div>
               )}
            </div>
          )}

          {/* Conditional: Other Note */}
          {order.surface === SurfaceType.OTHER && (
            <div className="mt-4 animate-fade-in">
              <label className="block text-sm font-bold text-gray-700 mb-2">Poznámka k povrchu</label>
              <input
                type="text"
                value={order.surfaceOtherNote || ''}
                onChange={(e) => updateOrder({ surfaceOtherNote: e.target.value })}
                placeholder="Specifikujte prosím..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100">
         <h2 className="text-2xl font-serif text-brand-900 mb-6">Detaily a Ozdoby</h2>
         
         <div className="mb-6">
           <label className="block text-sm font-bold text-gray-700 mb-2">Nápis na dort</label>
           <input
              type="text"
              value={order.inscription}
              onChange={(e) => updateOrder({ inscription: e.target.value })}
              placeholder="Např. Tomášek 5 let"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
           />
         </div>

         <div className="mb-6">
           <label className="block text-sm font-bold text-gray-700 mb-2">Další specifikace a detaily</label>
           <textarea
              rows={4}
              value={order.specifications}
              onChange={(e) => updateOrder({ specifications: e.target.value })}
              placeholder="Zvláštní požadavky na zdobení, alergie, atd..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
           />
         </div>

         <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Množství</label>
            <div className="flex items-center space-x-4">
               <button 
                  onClick={() => updateOrder({ quantity: Math.max(1, order.quantity - 1) })}
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold"
               >-</button>
               <span className="text-xl font-bold text-brand-900">{order.quantity} ks</span>
               <button 
                  onClick={() => updateOrder({ quantity: Math.min(10, order.quantity + 1) })}
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold"
               >+</button>
            </div>
         </div>
       </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      {/* Calendar Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100">
        <h2 className="text-xl font-serif text-brand-900 mb-4 flex items-center">
           <CalendarIcon className="mr-2 text-brand-500" /> Datum vyzvednutí
        </h2>
        <div className="flex justify-center">
            <Calendar 
            selectedDate={order.pickupDate} 
            onSelect={(date) => updateOrder({ pickupDate: date })} 
            />
        </div>
        {order.pickupDate && (
           <div className="mt-4 text-center p-3 bg-brand-50 text-brand-800 rounded-lg font-medium">
             Vybráno: {order.pickupDate.toLocaleDateString('cs-CZ')}
           </div>
        )}
      </div>

      {/* Location Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100 flex flex-col">
         <h2 className="text-xl font-serif text-brand-900 mb-4 flex items-center">
           <MapPin className="mr-2 text-brand-500" /> Místo vyzvednutí
        </h2>
        <div className="space-y-3 flex-1">
          {LOCATIONS.map(loc => (
            <button
              key={loc.id}
              onClick={() => updateOrder({ pickupLocationId: loc.id })}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                order.pickupLocationId === loc.id 
                  ? 'border-brand-500 bg-brand-50 shadow-sm ring-1 ring-brand-500' 
                  : 'border-gray-200 hover:border-brand-300 bg-white'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">{loc.name}</span>
                {loc.type === 'factory' && <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">Výrobna</span>}
              </div>
              <div className="text-sm text-gray-600 mt-1">{loc.address}</div>
              <div className="text-sm text-brand-600 mt-1 font-medium">{loc.phone}</div>
            </button>
          ))}
        </div>
        
        {selectedLocation && (
           <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Otevírací doba</h3>
              <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                 <span>Po - Pá:</span> <span className="font-medium text-right">09:00 - 17:00</span>
                 <span>So:</span> <span className="font-medium text-right">09:00 - 12:00</span>
                 <span>Ne:</span> <span className="font-medium text-right text-red-400">Zavřeno</span>
              </div>
           </div>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
     <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        
        {/* Contact Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100">
             <h2 className="text-xl font-serif text-brand-900 mb-4 flex items-center">
                <User className="mr-2 text-brand-500" /> Kontaktní údaje
             </h2>
             <div className="grid grid-cols-1 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Jméno a příjmení</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={order.customerName}
                            onChange={(e) => updateOrder({ customerName: e.target.value })}
                            className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                            placeholder="Jan Novák"
                        />
                        <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Telefon</label>
                        <div className="relative">
                            <input 
                                type="tel" 
                                value={order.customerPhone}
                                onChange={(e) => updateOrder({ customerPhone: e.target.value })}
                                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                                placeholder="+420 777 123 456"
                            />
                            <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                        <div className="relative">
                            <input 
                                type="email" 
                                value={order.customerEmail}
                                onChange={(e) => updateOrder({ customerEmail: e.target.value })}
                                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                                placeholder="jan.novak@email.cz"
                            />
                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        </div>
                     </div>
                 </div>
             </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-brand-200 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-300 to-brand-600" />
           
           <div className="text-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <h2 className="text-2xl font-serif text-gray-900">Souhrn Poptávky</h2>
           </div>

           <div className="space-y-4 divide-y divide-gray-100 text-sm">
              {order.images.length > 0 && (
                <div className="py-2">
                  <span className="block text-gray-500 text-xs uppercase font-bold mb-2">Předlohy</span>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {order.images.map(img => (
                      <img key={img.id} src={img.previewUrl} className="h-12 w-12 object-cover rounded-lg border border-gray-200" alt="cake preview" />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="py-2 grid grid-cols-2 gap-4">
                 <div>
                    <span className="block text-gray-500 text-xs uppercase font-bold">Tvar a patra</span>
                    <span className="font-medium text-gray-900">{order.shape} ({order.tiers}p)</span>
                 </div>
                 <div className="text-right">
                    <span className="block text-gray-500 text-xs uppercase font-bold">Rozměry</span>
                    <span className="font-medium text-gray-900">
                        {order.tierSizes.join(' / ')} cm
                        {order.customSizeNote && <span className="block text-xs text-brand-600 font-normal">{order.customSizeNote}</span>}
                    </span>
                 </div>
              </div>

              <div className="py-2 grid grid-cols-2 gap-4">
                 <div>
                    <span className="block text-gray-500 text-xs uppercase font-bold">Chuť</span>
                    <div className="font-medium text-gray-900">{order.filling}</div>
                    <div className="text-gray-600">{order.sponge} korpus</div>
                 </div>
                 <div className="text-right">
                    <span className="block text-gray-500 text-xs uppercase font-bold">Povrch</span>
                    <span className="font-medium text-gray-900">{order.surface}</span>
                    
                    {/* Summary Details for Surface */}
                    {order.surface === SurfaceType.MARZIPAN && order.marzipanColor && (
                       <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs text-gray-600">{order.marzipanColor}</span>
                          <div className="w-3 h-3 rounded-full border border-gray-200" style={{backgroundColor: getColorHex(order.marzipanColor)}} />
                       </div>
                    )}
                    
                    {order.surface === SurfaceType.CREAM && order.creamColor && (
                        <div className="flex items-center justify-end gap-1 mt-1">
                           <span className="text-xs text-gray-600">{order.creamColor}</span>
                           <div className="w-3 h-3 rounded-full border border-gray-200" style={{backgroundColor: getColorHex(order.creamColor)}} />
                        </div>
                    )}
                    
                    {order.surface === SurfaceType.CREAM_DRIP && (
                      <div className="flex flex-col items-end">
                        {order.creamColor && (
                            <div className="flex items-center justify-end gap-1 mt-1">
                               <span className="text-xs text-gray-600">{order.creamColor}</span>
                               <div className="w-3 h-3 rounded-full border border-gray-200" style={{backgroundColor: getColorHex(order.creamColor)}} />
                            </div>
                        )}
                        {order.dripType && <div className="text-xs text-gray-500 mt-0.5">{order.dripType}</div>}
                      </div>
                    )}
                    
                    {order.surface === SurfaceType.CHOCO_SHAVINGS && order.shavingsType && <div className="text-xs text-gray-500 mt-0.5">{order.shavingsType}</div>}

                    {order.surface === SurfaceType.EDIBLE_PRINT && order.ediblePrintImage && (
                       <div className="mt-1">
                          <img src={order.ediblePrintImage.previewUrl} alt="print preview" className="h-10 w-auto rounded border border-gray-200 ml-auto" />
                          <div className="text-[10px] text-red-500 mt-1">Nezapomeňte poslat mailem!</div>
                       </div>
                    )}
                 </div>
              </div>

               <div className="flex justify-between py-2">
                 <div>
                     <span className="block text-gray-500 text-xs uppercase font-bold">Vyzvednutí</span>
                     <div className="font-medium text-gray-900">{selectedLocation?.name}</div>
                 </div>
                 <div className="text-right flex flex-col justify-end">
                    <div className="font-bold text-brand-600">{order.pickupDate?.toLocaleDateString('cs-CZ')}</div>
                 </div>
              </div>
           </div>
        </div>
     </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white pb-24">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-brand-100">
         <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-brand-800 truncate">Poptávka dortu - Cukrářství Blahutovi</h1>
            <span className="hidden sm:inline-block text-xs font-bold text-brand-400 tracking-widest uppercase ml-4">Objednávkový systém</span>
         </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        <Steps currentStep={step} totalSteps={5} />
        
        <div className="mt-8">
           {step === 1 && renderStep1()}
           {step === 2 && renderStep2()}
           {step === 3 && renderStep3()}
           {step === 4 && renderStep4()}
           {step === 5 && renderStep5()}
        </div>
      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
          <button 
            onClick={prevStep} 
            disabled={step === 1}
            className={`flex items-center px-4 md:px-6 py-3 rounded-xl font-bold transition-colors ${step === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <ChevronLeft className="mr-1 h-5 w-5" /> <span className="hidden sm:inline">Zpět</span>
          </button>
          
          {step < 5 ? (
             <button 
               onClick={nextStep}
               className="flex-1 sm:flex-none flex justify-center items-center bg-brand-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-brand-700 hover:shadow-brand-300/50 transition-all"
             >
               Pokračovat <ChevronRight className="ml-1 h-5 w-5" />
             </button>
          ) : (
             <button 
               onClick={handleSubmitOrder}
               className="flex-1 sm:flex-none flex justify-center items-center bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 hover:shadow-green-300/50 transition-all"
             >
               Odeslat poptávku <Mail className="ml-2 h-5 w-5" />
             </button>
          )}
        </div>
      </div>
    </div>
  );
}