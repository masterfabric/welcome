'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ProcessStep } from '@/lib/markdown'
import Navbar from '@/components/layout/Navbar'
import PageLayout from '@/components/layout/PageLayout'
import TextCard from '@/components/ui/TextCard'
import TextButton from '@/components/ui/TextButton'
import EventList from '@/components/events/EventList'
import TextHierarchy from '@/components/ui/TextHierarchy'
import TextBadge from '@/components/ui/TextBadge'

export default function Home() {
  const { user, userProfile, loading, profileLoading, signInWithGitHub, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([])
  const [welcomeText, setWelcomeText] = useState<string>('')
  const [events, setEvents] = useState<any[]>([])
  const [isLoadingContent, setIsLoadingContent] = useState(true)
  const [landingPage, setLandingPage] = useState<any>(null)
  const [useDynamicLanding, setUseDynamicLanding] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showBadge, setShowBadge] = useState('masterfabric')
  const [authSuccess, setAuthSuccess] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)
  const [systemInfo, setSystemInfo] = useState({
    browser: '',
    device: '',
    os: '',
    network: '',
    memory: '',
    performance: '',
    screenResolution: '',
    networkDetails: {
      connectionType: '',
      downlink: '',
      uplink: '',
      rtt: '',
      effectiveType: '',
      saveData: false,
      ip: '',
      latency: '',
      networkStatus: 'Checking...'
    }
  })

  // Check for auth success parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('auth_success') === 'true') {
        setAuthSuccess(true)
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  // Collect system information
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent;
      let browserInfo = 'Unknown Browser';

      if (userAgent.indexOf("Firefox") > -1) {
        browserInfo = `Firefox ${userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || ''}`;
      } else if (userAgent.indexOf("Chrome") > -1) {
        browserInfo = `Chrome ${userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || ''}`;
      } else if (userAgent.indexOf("Safari") > -1) {
        browserInfo = `Safari ${userAgent.match(/Safari\/([0-9.]+)/)?.[1] || ''}`;
      } else if (userAgent.indexOf("Edge") > -1) {
        browserInfo = `Edge ${userAgent.match(/Edge\/([0-9.]+)/)?.[1] || ''}`;
      } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
        browserInfo = 'Internet Explorer';
      }

      let osInfo = 'Unknown OS';
      if (userAgent.indexOf("Win") > -1) {
        osInfo = 'Windows';
      } else if (userAgent.indexOf("Mac") > -1) {
        osInfo = 'macOS';
      } else if (userAgent.indexOf("Linux") > -1) {
        osInfo = 'Linux';
      } else if (userAgent.indexOf("Android") > -1) {
        osInfo = 'Android';
      } else if (userAgent.indexOf("iOS") > -1 || userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) {
        osInfo = 'iOS';
      }

      const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(userAgent);
      const deviceInfo = isMobile ? 'Mobile' : 'Desktop';

      // Enhanced Network Information
      const connectionInfo = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      let networkInfo = 'Unknown Network';
      let networkDetails = {
        connectionType: 'Unknown',
        downlink: 'Unknown',
        uplink: 'Unknown',
        rtt: 'Unknown',
        effectiveType: 'Unknown',
        saveData: false,
        ip: 'Detecting...',
        latency: 'Measuring...',
        networkStatus: 'Checking...'
      };

      if (connectionInfo) {
        networkInfo = `${connectionInfo.effectiveType || 'Unknown'} - ${connectionInfo.downlink || '?'} Mbps`;
        networkDetails = {
          connectionType: connectionInfo.type || 'Unknown',
          downlink: connectionInfo.downlink ? `${connectionInfo.downlink} Mbps` : 'Unknown',
          uplink: connectionInfo.uplink ? `${connectionInfo.uplink} Mbps` : 'Unknown',
          rtt: connectionInfo.rtt ? `${connectionInfo.rtt}ms` : 'Unknown',
          effectiveType: connectionInfo.effectiveType || 'Unknown',
          saveData: connectionInfo.saveData || false,
          ip: 'Detecting...',
          latency: 'Measuring...',
          networkStatus: navigator.onLine ? 'Online' : 'Offline'
        };
      }

      let memoryInfo = 'Unknown Memory';
      if ((performance as any).memory) {
        const memoryMB = Math.round(((performance as any).memory.jsHeapSizeLimit / 1024 / 1024));
        memoryInfo = `${memoryMB} MB Available`;
      }

      const screenRes = `${window.screen.width}×${window.screen.height}`;

      const perfEntries = performance.getEntriesByType('navigation');
      let perfInfo = 'Measuring...';
      if (perfEntries.length > 0) {
        const navTiming = perfEntries[0] as PerformanceNavigationTiming;
        const loadTime = Math.round(navTiming.loadEventEnd - navTiming.startTime);
        perfInfo = `Page load: ${loadTime}ms`;
      }

      const newSystemInfo = {
        browser: browserInfo,
        device: deviceInfo,
        os: osInfo,
        network: networkInfo,
        memory: memoryInfo,
        performance: perfInfo,
        screenResolution: screenRes,
        networkDetails
      };

      setSystemInfo(newSystemInfo);

      // Perform additional network diagnostics
      performNetworkDiagnostics(newSystemInfo);

      try {
        localStorage.setItem('systemInfo', JSON.stringify(newSystemInfo));
      } catch (e) {
        console.error('Failed to save system info to localStorage:', e);
      }
    }
  }, []);

  // Enhanced network diagnostics function
  const performNetworkDiagnostics = async (currentInfo: any) => {
    try {
      // Test latency to a reliable endpoint
      const startTime = performance.now();
      const response = await fetch('/api/version', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      // Get IP information
      let ipInfo = 'Unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipInfo = ipData.ip;
      } catch (e) {
        console.warn('Could not fetch IP info:', e);
      }

      // Update system info with network diagnostics
      setSystemInfo(prev => ({
        ...prev,
        networkDetails: {
          ...prev.networkDetails,
          latency: `${latency}ms`,
          ip: ipInfo,
          networkStatus: response.ok ? 'Connected' : 'Limited'
        }
      }));

    } catch (error) {
      console.warn('Network diagnostics failed:', error);
      setSystemInfo(prev => ({
        ...prev,
        networkDetails: {
          ...prev.networkDetails,
          latency: 'Failed',
          ip: 'Unknown',
          networkStatus: 'Error'
        }
      }));
    }
  };

  // Initial loading animation effect
  useEffect(() => {
    if (!initialLoading) return;

    let blinkCount = 0;
    let lastToggleTime = 0;
    let animationFrameId: number;
    let timeoutId: NodeJS.Timeout;
    const blinkInterval = 400;

    const animate = (timestamp: number) => {
      if (timestamp - lastToggleTime >= blinkInterval) {
        setShowBadge(prev => prev === 'masterfabric' ? '' : 'masterfabric');
        lastToggleTime = timestamp;
        blinkCount++;

        if (blinkCount >= 5) {
          setShowBadge('LOADING...');

          timeoutId = setTimeout(() => {
            setInitialLoading(false);
          }, 3500);

          return;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [initialLoading]);

  // Simple redirect logic with guards to avoid loops
  const redirectedRef = useRef(false)
  useEffect(() => {
    if (redirectedRef.current) return
    if (loading) return

    if (!user) return // show landing when not authenticated
    
    // Don't wait for profile - redirect immediately if we have user
    // Profile-dependent redirects will happen in target pages
    if (user && !profileLoading && userProfile) {
      redirectedRef.current = true
      console.log('🔄 User authenticated, checking profile:', userProfile)

      if (userProfile.master_email && userProfile.first_name && userProfile.last_name) {
        router.replace('/worklog')
      } else if (userProfile.first_name && userProfile.last_name) {
        router.replace('/email')
      } else {
        router.replace('/bio')
      }
    } else if (user && !userProfile && !profileLoading) {
      // If user exists but no profile and not loading, redirect to bio
      redirectedRef.current = true
      router.replace('/bio')
    }
  }, [user, userProfile, loading, profileLoading, router])

  // Load content
  useEffect(() => {
    const loadContent = async () => {
      try {
        // Try to load dynamic landing page first
        try {
          const landingResponse = await fetch('/api/landing')
          if (landingResponse.ok) {
            const landingData = await landingResponse.json()
            if (landingData.landingPage) {
              setLandingPage(landingData.landingPage)
              setUseDynamicLanding(true)
              setIsLoadingContent(false)
              return // Use dynamic content, skip loading static content
            }
          }
        } catch (error) {
          console.log('No dynamic landing page found, using static content')
        }

        // Fallback to static content
        const stepsResponse = await fetch('/api/process-overview')
        if (!stepsResponse.ok) {
          throw new Error(`Failed to load process overview: ${stepsResponse.status}`)
        }
        const stepsData = await stepsResponse.json()
        setProcessSteps(stepsData.steps || [])

        const welcomeResponse = await fetch('/api/welcome-text')
        if (!welcomeResponse.ok) {
          throw new Error(`Failed to load welcome text: ${welcomeResponse.status}`)
        }
        const welcomeData = await welcomeResponse.json()
        setWelcomeText(welcomeData.welcomeText || '')

        // Fetch events (public)
        try {
          const eventsResponse = await fetch('/api/events')
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json()
            setEvents(Array.isArray(eventsData.events) ? eventsData.events : [])
          } else {
            setEvents([])
          }
        } catch {
          setEvents([])
        }
      } catch (error) {
        console.error('Error loading content:', error)
        setWelcomeText('Failed to load content. Please refresh the page.')
        setProcessSteps([])
      } finally {
        setIsLoadingContent(false)
      }
    }

    loadContent()
  }, [])

  const handleGitHubSignIn = async () => {
    setHasRedirected(false)
    await signInWithGitHub()
  }

  const handleShareEvents = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const url = `${origin}/events`
      const title = 'Upcoming Events'
      const text = 'Join our upcoming events and connect with the community. View details here:'
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({ title, text, url })
        return
      }
      await navigator.clipboard.writeText(`${text} ${url}`)
      alert('Events link copied to clipboard')
    } catch (e) {
      console.warn('Share failed, showing fallback prompt')
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const url = `${origin}/events`
      // eslint-disable-next-line no-alert
      prompt('Copy events URL:', url)
    }
  }



  // Show initial loading animation
  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        {showBadge && (
          <TextBadge
            variant="default"
            blinking={showBadge === 'masterfabric'}
            rgbEffect={showBadge === 'LOADING...'}
          >
            {showBadge}
          </TextBadge>
        )}

        {showBadge === 'LOADING...' && (
          <div className="mt-8 text-xs text-center max-w-2xl">
            <div className="grid grid-cols-2 gap-2 text-left mb-6">
              <div className="muted">BROWSER</div>
              <div>{systemInfo.browser}</div>

              <div className="muted">DEVICE</div>
              <div>{systemInfo.device}</div>

              <div className="muted">OS</div>
              <div>{systemInfo.os}</div>

              <div className="muted">NETWORK</div>
              <div>{systemInfo.network}</div>

              <div className="muted">RESOLUTION</div>
              <div>{systemInfo.screenResolution}</div>

              <div className="muted">MEMORY</div>
              <div>{systemInfo.memory}</div>

              <div className="muted">PERFORMANCE</div>
              <div>{systemInfo.performance}</div>
            </div>

            {/* Enhanced Network Information Section */}
            <div className="border-t border-gray-600 pt-4 mb-4">
              <div className="text-xs muted mb-3 text-center">
                NETWORK DIAGNOSTICS
              </div>
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="muted">CONNECTION TYPE</div>
                <div>{systemInfo.networkDetails.effectiveType.toUpperCase()}</div>

                <div className="muted">DOWNLINK SPEED</div>
                <div>{systemInfo.networkDetails.downlink}</div>

                <div className="muted">NETWORK RTT</div>
                <div>{systemInfo.networkDetails.rtt}</div>

                <div className="muted">SERVER LATENCY</div>
                <div className={systemInfo.networkDetails.latency.includes('ms') ? 'text-green-400' : 'text-yellow-400'}>
                  {systemInfo.networkDetails.latency}
                </div>

                <div className="muted">PUBLIC IP</div>
                <div className={systemInfo.networkDetails.ip.includes('.') ? 'text-green-400' : 'text-yellow-400'}>
                  {systemInfo.networkDetails.ip}
                </div>

                <div className="muted">STATUS</div>
                <div className={
                  systemInfo.networkDetails.networkStatus === 'Connected' ? 'text-green-400' :
                  systemInfo.networkDetails.networkStatus === 'Online' ? 'text-blue-400' :
                  systemInfo.networkDetails.networkStatus === 'Error' ? 'text-red-400' :
                  'text-yellow-400'
                }>
                  {systemInfo.networkDetails.networkStatus.toUpperCase()}
                </div>

                {systemInfo.networkDetails.saveData && (
                  <>
                    <div className="muted">DATA SAVER</div>
                    <div className="text-orange-400">ENABLED</div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 text-center text-xs muted">
              SYSTEM VERIFICATION IN PROGRESS...
            </div>
          </div>
        )}
      </div>
    )
  }

  // Show loading when auth is checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TextBadge variant="default">LOADING...</TextBadge>
      </div>
    )
  }


  // If user is authenticated but hasn't completed all steps, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <TextBadge variant="success">
          {authSuccess ? 'AUTHENTICATION SUCCESSFUL' : 'REDIRECTING...'}
        </TextBadge>
        {authSuccess && (
          <div className="mt-4 text-center text-xs muted max-w-md">
            <div>Welcome back! Setting up your workspace...</div>
            <div className="mt-2">You will be redirected to the next step shortly.</div>
          </div>
        )}
      </div>
    )
  }

  // Render dynamic landing page
  const renderDynamicLanding = () => {
    if (!landingPage) return null

    return (
      <div className="min-h-screen">
        <Navbar user={userProfile} onSignOut={signOut} />

        <PageLayout
          title={landingPage.title}
          subtitle={landingPage.subtitle}
        >
          {isLoadingContent ? (
            <TextCard title="LOADING">
              <TextHierarchy level={1} muted>
                Loading content...
              </TextHierarchy>
            </TextCard>
          ) : (
            <>
              {landingPage.sections && landingPage.sections.map((section: any) => {
                // Render different section types
                switch (section.section_type) {
                  case 'welcome':
                    return (
                      <TextCard key={section.id} title={section.title}>
                        <TextHierarchy level={1}>
                          {section.content.text || ''}
                        </TextHierarchy>
                      </TextCard>
                    )

                  case 'process':
                    return (
                      <TextCard key={section.id} title={section.title}>
                        {section.content.steps && section.content.steps.map((step: any, stepIndex: number) => (
                          <div key={stepIndex}>
                            <TextHierarchy level={1} emphasis className={stepIndex > 0 ? "mt-4" : ""}>
                              {step.title}
                            </TextHierarchy>
                            {step.items && step.items.map((item: string, itemIndex: number) => (
                              <TextHierarchy key={itemIndex} level={2} muted>
                                {item}
                              </TextHierarchy>
                            ))}
                          </div>
                        ))}
                      </TextCard>
                    )

                  case 'info':
                    return (
                      <TextCard key={section.id} title={section.title}>
                        {section.content.items && section.content.items.map((item: any, index: number) => (
                          <TextHierarchy key={index} level={1} className={index < section.content.items.length - 1 ? "mb-3" : ""}>
                            <TextBadge variant={item.variant || "default"}>{item.label}</TextBadge> {item.value}
                          </TextHierarchy>
                        ))}
                      </TextCard>
                    )

                  case 'cta':
                    return (
                      <div key={section.id} className="flex justify-center pt-8">
                        <TextButton
                          onClick={handleGitHubSignIn}
                          variant="success"
                          className="text-base px-8 py-3"
                        >
                          {section.content.buttonText || 'BEGIN ONBOARDING → GITHUB LOGIN'}
                        </TextButton>
                      </div>
                    )

                  case 'hero':
                    return (
                      <TextCard key={section.id} title={section.title} variant="default">
                        <TextHierarchy level={1} emphasis className="text-lg mb-4">
                          {section.content.heading || ''}
                        </TextHierarchy>
                        <TextHierarchy level={2} muted>
                          {section.content.description || ''}
                        </TextHierarchy>
                      </TextCard>
                    )

                  case 'features':
                    return (
                      <TextCard key={section.id} title={section.title}>
                        {section.content.features && section.content.features.map((feature: any, index: number) => (
                          <div key={index} className={index < section.content.features.length - 1 ? "mb-4" : ""}>
                            <TextHierarchy level={1} emphasis>
                              {feature.title}
                            </TextHierarchy>
                            <TextHierarchy level={2} muted>
                              {feature.description}
                            </TextHierarchy>
                          </div>
                        ))}
                      </TextCard>
                    )

                  case 'custom':
                  default:
                    return (
                      <TextCard key={section.id} title={section.title}>
                        <TextHierarchy level={1}>
                          {typeof section.content === 'string' 
                            ? section.content 
                            : JSON.stringify(section.content, null, 2)}
                        </TextHierarchy>
                      </TextCard>
                    )
                }
              })}

              {/* Always show events if available */}
              <EventList
                onRegister={() => router.push('/events')}
                showRegisterButton={false}
                hideWhenEmpty
                maxItems={3}
                section
              />

              <TextCard variant="default" className="mt-8">
                <TextHierarchy level={1} muted>
                  Event participation is public. By registering, you consent to processing your data for event management purposes.
                </TextHierarchy>
              </TextCard>
            </>
          )}
        </PageLayout>
      </div>
    )
  }

  // Render static landing page (fallback)
  const renderStaticLanding = () => (
    <div className="min-h-screen">
      <Navbar user={userProfile} onSignOut={signOut} />

      <PageLayout
        title="ONBOARDING"
        subtitle="Developer Integration System"
      >
        <TextCard title="WELCOME">
          {isLoadingContent ? (
            <TextHierarchy level={1} muted>
              Loading welcome text...
            </TextHierarchy>
          ) : (
            welcomeText
          )}
        </TextCard>


        <TextCard title="PROCESS OVERVIEW">
          {isLoadingContent ? (
            <TextHierarchy level={1} muted>
              Loading process overview...
            </TextHierarchy>
          ) : (
            processSteps.map((step, stepIndex) => (
              <div key={stepIndex}>
                <TextHierarchy level={1} emphasis className={stepIndex > 0 ? "mt-4" : ""}>
                  {step.title}
                </TextHierarchy>
                {step.items.map((item, itemIndex) => (
                  <TextHierarchy key={itemIndex} level={2} muted>
                    {item}
                  </TextHierarchy>
                ))}
              </div>
            ))
          )}
        </TextCard>

        <EventList
          onRegister={() => router.push('/events')}
          showRegisterButton={false}
          hideWhenEmpty
          maxItems={3}
          section
        />

        {/* Share events removed by request */}

        <TextCard title="SYSTEM INFORMATION">
          <TextHierarchy level={1} className="mb-3">
            <TextBadge variant="default">INTERFACE</TextBadge> Text-based UI with whitespace hierarchy
          </TextHierarchy>
          <TextHierarchy level={1} className="mb-3">
            <TextBadge variant="default">FONT</TextBadge> JetBrains Mono monospace
          </TextHierarchy>
          <TextHierarchy level={1} className="mb-3">
            <TextBadge variant="success">SUCCESS</TextBadge> Green indicators for completed tasks
          </TextHierarchy>
          <TextHierarchy level={1} className="mb-3">
            <TextBadge variant="warning">PENDING</TextBadge> Yellow indicators for pending tasks
          </TextHierarchy>
          <TextHierarchy level={1}>
            <TextBadge variant="error">ERROR</TextBadge> Orange indicators for failed operations
          </TextHierarchy>
        </TextCard>


        <div className="flex justify-center pt-8">
          <TextButton
            onClick={handleGitHubSignIn}
            variant="success"
            className="text-base px-8 py-3"
          >
            BEGIN ONBOARDING → GITHUB LOGIN
          </TextButton>
        </div>

        <TextCard variant="default" className="mt-8">
          <TextHierarchy level={1} muted>
            Event participation is public. By registering, you consent to processing your data for event management purposes.
          </TextHierarchy>
        </TextCard>
      </PageLayout>

    </div>
  )

  return useDynamicLanding ? renderDynamicLanding() : renderStaticLanding()
}