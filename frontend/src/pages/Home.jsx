import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Search, Navigation, ChevronDown, Loader, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import ApiService from '../services/api'

const Home = () => {
  const navigate = useNavigate()
  const [districts, setDistricts] = useState([])
  const [filteredDistricts, setFilteredDistricts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Load districts on component mount
useEffect(() => {
  const savedDistrict = localStorage.getItem('selectedDistrict');
  if (savedDistrict) {
    const district = JSON.parse(savedDistrict);
    toast.success(`पिछली बार चुना गया जिला: ${district.name}`);
    // ✅ Only show toast, don’t auto-navigate
  }
  loadDistricts();
}, []);



  // Filter districts based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDistricts(districts)
    } else {
      const filtered = districts.filter(district =>
        district.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        district.hindi.includes(searchQuery)
      )
      setFilteredDistricts(filtered)
    }
  }, [searchQuery, districts])

  const loadDistricts = async () => {
    try {
      setIsLoading(true)
      const response = await ApiService.getDistricts()
      if (response.success) {
        setDistricts(response.data)
        setFilteredDistricts(response.data)
      }
    } catch (error) {
      console.error('Failed to load districts:', error)
      toast.error('जिलों की सूची लोड नहीं हो सकी')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDistrictSelect = (district) => {
    toast.success(`${district.name} (${district.hindi}) चुना गया`);
    
    // ✅ Save the selected district in localStorage
    localStorage.setItem('selectedDistrict', JSON.stringify(district));
    
    navigate(`/dashboard/${district.id}`, { 
      state: { district } 
    });
  };
  

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('आपका ब्राउज़र लोकेशन सपोर्ट नहीं करता');
      return;
    }
  
    setIsDetecting(true);
  
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000,
        });
      });
  
      const { latitude, longitude } = position.coords;
  
      // ✅ Step 1: Reverse geocoding using Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
      );
      const data = await response.json();
  
      // ✅ Step 2: Extract district
      const districtName =
        data.address?.district ||
        data.address?.state_district ||
        data.address?.county ||
        data.address?.city ||
        data.address?.town ||
        data.address?.village;
  
      if (!districtName) {
        toast.error('स्थान से जिला नहीं मिल सका');
        return;
      }
  
      // ✅ Step 3: Match district from list
      const matchedDistrict = districts.find((d) =>
        districtName.toLowerCase().includes(d.name.toLowerCase())
      );
  
      if (matchedDistrict) {
        toast.success(`स्थान मिला: ${matchedDistrict.name}`);
        handleDistrictSelect(matchedDistrict);
      } else {
        toast.error(`"${districtName}" जिले का डेटा उपलब्ध नहीं है`);
      }
    } catch (error) {
      let errorMessage = 'स्थान का पता नहीं लगा सका';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage =
            'लोकेशन की अनुमति नहीं दी गई। कृपया ब्राउज़र सेटिंग्स में लोकेशन एक्सेस को इनेबल करें।';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage =
            'लोकेशन की जानकारी उपलब्ध नहीं है। कृपया अपनी GPS सेटिंग्स जांचें।';
          break;
        case error.TIMEOUT:
          errorMessage = 'लोकेशन खोजने में समय लग रहा है। कृपया पुनः प्रयास करें।';
          break;
        default:
          errorMessage = 'लोकेशन प्राप्त करने में त्रुटि हुई।';
      }
      toast.error(errorMessage);
    } finally {
      setIsDetecting(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="nav-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-3xl font-extrabold text-gradient">MGNREGA Dashboard</h1>
                <p className="text-sm section-subtitle">मनरेगा डैशबोर्ड</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="section-title text-gradient mb-4">
            अपना जिला चुनें
          </h2>
          <p className="text-lg text-gray-600 mb-6">MGNREGA के प्रमुख सूचकांक ज़िला-स्तर पर</p>
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">रियल-टाइम दृश्य</span>
            <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm">सरल चार्ट</span>
            <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm">जिला-वार अंतर्दृष्टि</span>
          </div>
        </div>

        <div className="card max-w-2xl mx-auto">
          {/* Location Detection Button */}
          <div className="mb-6">
            <button
              onClick={detectLocation}
              disabled={isDetecting}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
            >
              {isDetecting ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <Navigation className="h-5 w-5" />
              )}
              <span>
                {isDetecting ? 'स्थान खोजा जा रहा है...' : 'मेरा स्थान खोजें'}
              </span>
            </button>
          </div>

          <div className="text-center text-gray-500 mb-6">
            या
          </div>

          {/* District Search */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="जिला खोजें (हिंदी या अंग्रेजी में)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                className="input-field pl-10 pr-10"
              />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            {/* Districts Dropdown */}
            {(isDropdownOpen || searchQuery) && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <Loader className="h-5 w-5 animate-spin mx-auto mb-2" />
                    <span className="text-gray-500">जिले लोड हो रहे हैं...</span>
                  </div>
                ) : filteredDistricts.length > 0 ? (
                  filteredDistricts.map((district) => (
                    <button
                      key={district.id}
                      onClick={() => handleDistrictSelect(district)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{district.name}</div>
                          <div className="text-sm text-gray-600">{district.hindi}</div>
                        </div>
                        <MapPin className="h-4 w-4 text-gray-400" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    कोई जिला नहीं मिला
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Click outside to close dropdown */}
          {isDropdownOpen && (
            <div 
              className="fixed inset-0 z-5"
              onClick={() => setIsDropdownOpen(false)}
            />
          )}
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-3xl font-extrabold text-gradient mb-2">52</div>
            <div className="text-gray-600">कुल जिले</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-extrabold text-gradient mb-2">100%</div>
            <div className="text-gray-600">डेटा कवरेज</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-extrabold text-gradient mb-2">Live</div>
            <div className="text-gray-600">रियल टाइम डेटा</div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home

