'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import DialogShell from '@/components/dialog-shell'
import ConfirmDialog from '@/components/confirm-dialog'
import USDTIcon from '@/svgs/tokens/usdt.svg'
import CopyIcon from '@/svgs/copy-icon.svg'
import { ChevronDown, SquarePen, Trash2 } from 'lucide-react'
import { useCoins, useManageWithdrawAddress, useWithdrawAddressList } from '@/requests'
import type { Coin, Network, UserAddress } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/toast'
import { useRouter } from '@/i18n/navigation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import ChevronSVG from '@/svgs/chevron.svg'
import { LoadingSpinner } from '@/components/loading-spinner'
import { IMG_BASE_URL } from '@/consts'

export default function AddressManagementPage() {
  const t = useTranslations()
  const router = useRouter()
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const { userId, userInfo } = useAuth()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null)
  
  // Form state
  const [showCoinDropdown, setShowCoinDropdown] = useState(false)
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [addressInput, setAddressInput] = useState('')
  const [remarkInput, setRemarkInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch coins and networks
  const { data: coins, isLoading: isLoadingCoins } = useCoins()
  
  // Fetch withdraw address list
  const { data: addresses, isLoading: isLoadingAddresses, refetch: refetchAddresses } = useWithdrawAddressList(Number(userId) || 0)
  
  // Manage withdraw address mutation
  const manageAddressMutation = useManageWithdrawAddress()

  // Reset form when add dialog opens
  useEffect(() => {
    if (showAddDialog) {
      setSelectedCoin(null)
      setSelectedNetwork(null)
      setAddressInput('')
      setRemarkInput('')
      setShowCoinDropdown(false)
      setShowNetworkDropdown(false)
    }
  }, [showAddDialog])

  // Set form values when edit dialog opens
  useEffect(() => {
    if (showEditDialog && selectedAddress && coins) {
      const coin = coins.find(c => c.coinId === selectedAddress.coinId)
      if (coin) {
        setSelectedCoin(coin)
        const network = coin.networks.find(n => n.networkId === selectedAddress.networkId)
        if (network) {
          setSelectedNetwork(network)
        }
      }
      setAddressInput(selectedAddress.address)
      setRemarkInput(selectedAddress.remark || '')
      setShowCoinDropdown(false)
      setShowNetworkDropdown(false)
    }
  }, [showEditDialog, selectedAddress, coins])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowCoinDropdown(false)
      setShowNetworkDropdown(false)
    }

    if (showCoinDropdown || showNetworkDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showCoinDropdown, showNetworkDropdown])

  const handleEdit = (address: UserAddress) => {
    setSelectedAddress(address)
    setShowEditDialog(true)
  }

  const handleDelete = (address: UserAddress) => {
    setSelectedAddress(address)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedAddress || !userId) {
      setShowDeleteDialog(false)
      setSelectedAddress(null)
      return
    }

    try {
      await manageAddressMutation.mutateAsync({
        userId: Number(userId),
        operate: 2, // 2: delete
        id: selectedAddress.id
      })
      
      toast.success(t('wallet.addressDeletedSuccess'))
      
      // Refetch address list
      refetchAddresses()
    } catch (error: any) {
      toast.error(error?.response?.data?.msg || t('wallet.deleteAddressFailed'))
    } finally {
      setShowDeleteDialog(false)
      setSelectedAddress(null)
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId) {
      toast.error(t('wallet.pleaseLogin'))
      return
    }
    
    if (!selectedCoin || !selectedNetwork || !addressInput.trim()) {
      toast.error(t('wallet.fillAllFields'))
      return
    }

    setIsSubmitting(true)
    
    try {
      await manageAddressMutation.mutateAsync({
        userId: Number(userId),
        operate: 1, // 1: add
        coinId: selectedCoin.coinId,
        networkId: selectedNetwork.networkId,
        address: addressInput.trim(),
        remark: remarkInput.trim() || undefined
      })
      
      toast.success(t('wallet.addressAddedSuccess'))
      
      // Reset form
      setShowAddDialog(false)
      setSelectedCoin(null)
      setSelectedNetwork(null)
      setAddressInput('')
      setRemarkInput('')
      
      // Refetch address list
      refetchAddresses()
    } catch (error: any) {
      toast.error(error?.response?.data?.msg || t('wallet.addAddressFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId || !selectedAddress) {
      toast.error(t('wallet.pleaseLogin'))
      return
    }
    
    if (!selectedCoin || !selectedNetwork || !addressInput.trim()) {
      toast.error(t('wallet.fillAllFields'))
      return
    }

    setIsSubmitting(true)
    
    try {
      await manageAddressMutation.mutateAsync({
        userId: Number(userId),
        operate: 3, // 3: edit
        id: selectedAddress.id,
        coinId: selectedCoin.coinId,
        networkId: selectedNetwork.networkId,
        address: addressInput.trim(),
        remark: remarkInput.trim() || undefined
      })
      
      toast.success(t('wallet.addressEditedSuccess'))
      
      // Reset form
      setShowEditDialog(false)
      setSelectedAddress(null)
      setSelectedCoin(null)
      setSelectedNetwork(null)
      setAddressInput('')
      setRemarkInput('')
      
      // Refetch address list
      refetchAddresses()
    } catch (error: any) {
      toast.error(error?.response?.data?.msg || t('wallet.editAddressFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Group addresses by coin and network
  const groupedAddresses = addresses?.reduce((acc, address) => {
    const key = `${address.coinName}-${address.network}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(address)
    return acc
  }, {} as Record<string, UserAddress[]>) || {}

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success(t('wallet.addressCopied'))
  }

  return (
    <>
      <div className='flex flex-col gap-8 pb-24 lg:pb-8'>
        {/* Mobile Header with back button */}
        {isMobile && (
          <div className='sticky top-0 z-10 flex items-center gap-2 bg-[#0E0E10]'>
            <button
              onClick={() => router.back()}
              className='flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 p-1.5'
            >
              <ChevronSVG className='h-5 w-5 rotate-90 text-white/80' />
            </button>
            <h1 className='flex-1 text-center text-base font-semibold text-white/80 pr-9'>{t('wallet.addressManagement')}</h1>
          </div>
        )}

        {/* Desktop Title with Add Button */}
        {!isMobile && (
          <div className='flex items-center justify-between'>
            <h1 className='text-base font-medium'>{t('wallet.addressManagement')}</h1>
            <button
              onClick={() => setShowAddDialog(true)}
              className='bg-card flex items-center justify-center rounded-lg px-4 py-2 hover:opacity-80'>
              <span className='text-base font-medium'>{t('wallet.addAddress')}</span>
            </button>
          </div>
        )}

        <div className='flex flex-col gap-6'>
          {isLoadingAddresses ? (
            <div className='flex items-center justify-center py-12'>
              <LoadingSpinner size='md' text={t('wallet.loadingAddresses')} />
            </div>
          ) : !addresses || addresses.length === 0 ? (
            <div className='flex items-center justify-center py-8'>
              <span className='text-secondary text-sm'>{t('wallet.noAddressesFound')}</span>
            </div>
          ) : (
            Object.entries(groupedAddresses).map(([key, addressGroup]) => (
              <div key={key} className='flex flex-col gap-2'>
                {/* Network & Coin Header */}
                <div className='flex items-center justify-between'>
                  <span className='text-base font-medium'>
                    {addressGroup[0].network} - {addressGroup[0].coinName}
                  </span>
                  {isMobile && (
                    <div className='flex items-center gap-2'>
                      <button 
                        className='rounded-lg bg-white/5 px-3 py-1 text-xs font-medium text-white hover:opacity-80'
                        onClick={() => handleEdit(addressGroup[0])}>
                        {t('wallet.edit')}
                      </button>
                      <button 
                        className='rounded-lg bg-white/5 px-3 py-1 text-xs font-medium text-[#F75353] hover:opacity-80'
                        onClick={() => handleDelete(addressGroup[0])}>
                        {t('wallet.delete')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Address List for this coin/network */}
                {addressGroup.map((address, index) => (
                  <div key={address.id} className='border-card flex flex-col justify-center gap-1 rounded-lg border px-4 py-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-secondary text-sm font-medium'>
                        {address.remark || t('wallet.myAddress', { number: index + 1 })}
                      </span>
                      {!isMobile && (
                        <div className='flex items-center gap-1'>
                          <button className='hover:opacity-80' onClick={() => handleEdit(address)}>
                            <SquarePen className='h-5 w-5 text-secondary' />
                          </button>
                          <button 
                            className='flex h-6 w-6 items-center justify-center hover:opacity-80' 
                            onClick={() => handleDelete(address)}>
                            <Trash2 className='h-5 w-5 text-secondary' />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className='flex items-center gap-1'>
                      {isMobile ? (
                        <p className='text-base font-medium text-white/80 flex-1 overflow-hidden text-ellipsis whitespace-nowrap w-[100px]'>
                          {address.address}
                        </p>
                      ) : (
                        <span className='text-base font-medium text-white/80 break-all'>{address.address}</span>
                      )}
                      <button className='hover:opacity-80 flex-shrink-0' onClick={() => handleCopyAddress(address.address)}>
                        <CopyIcon className='h-5 w-5 text-secondary' />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}

          {/* Add Address Button - Mobile Only */}
          {isMobile && (
            <div className='flex items-center gap-1 mt-2'>
              <button
                onClick={() => setShowAddDialog(true)}
                className='bg-card flex-none items-center justify-center rounded-lg px-4 py-2 hover:opacity-80'>
                <span className='text-base font-medium'>{t('wallet.addAddress')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Address Dialog */}
      {showAddDialog && (
        <DialogShell title={t('wallet.addAddress')} close={() => setShowAddDialog(false)} mobilePosition='bottom'>
          <form className='flex flex-col gap-4' onSubmit={handleAddAddress}>
            {/* Coin Selection */}
            <div className='flex flex-col gap-1'>
              <label className='text-secondary text-sm font-medium'>{t('wallet.coin')}</label>
              <div className='relative'>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowNetworkDropdown(false) // Close network dropdown first
                    setShowCoinDropdown(!showCoinDropdown)
                  }}
                  className='border-card bg-card hover:bg-card/80 flex w-full items-center justify-between rounded-lg border border-white/10 px-4 py-3'>
                  <div className='flex items-center justify-center gap-2'>
                    {selectedCoin ? (
                      <>
                        {selectedCoin.logo && <img src={`${IMG_BASE_URL}${selectedCoin.logo}`} alt={selectedCoin.coinName} className='h-5 w-5' />}
                        <span className='text-secondary text-sm font-medium'>{selectedCoin.coinName}</span>
                      </>
                    ) : (
                      <span className='text-secondary/50 text-sm font-medium'>{t('wallet.selectCoin')}</span>
                    )}
                  </div>
                  <ChevronDown className='h-5 w-5 text-white' />
                </button>
                
                {showCoinDropdown && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className='custom-thin-scrollbar absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0a] shadow-lg'>
                    {isLoadingCoins ? (
                      <div className='px-4 py-3 text-sm text-secondary'>{t('wallet.loading')}</div>
                    ) : coins && coins.length > 0 ? (
                      coins.map((coin) => (
                        <button
                          key={coin.coinId}
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCoin(coin)
                            setSelectedNetwork(null) // Reset network when coin changes
                            setShowCoinDropdown(false)
                          }}
                          className='flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-white/5'>
                          {coin.logo && <img src={`${IMG_BASE_URL}${coin.logo}`} alt={coin.coinName} className='h-5 w-5' />}
                          <span className='text-secondary text-sm font-medium'>{coin.coinName}</span>
                        </button>
                      ))
                    ) : (
                      <div className='px-4 py-3 text-sm text-secondary'>{t('wallet.noCoinsAvailable')}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Network Selection */}
            <div className='flex flex-col gap-1'>
              <label className='text-secondary text-sm font-medium'>{t('wallet.network')}</label>
              <div className='relative'>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCoinDropdown(false) // Close coin dropdown first
                    setShowNetworkDropdown(!showNetworkDropdown)
                  }}
                  disabled={!selectedCoin}
                  className='border-card bg-card hover:bg-card/80 flex w-full items-center justify-between rounded-lg border border-white/10 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed'>
                  <div className='flex items-center justify-center gap-2'>
                    {selectedNetwork ? (
                      <span className='text-secondary text-sm font-medium'>{selectedNetwork.network}</span>
                    ) : (
                      <span className='text-secondary/50 text-sm font-medium'>{t('wallet.selectNetwork')}</span>
                    )}
                  </div>
                  <ChevronDown className='h-5 w-5 text-white' />
                </button>
                
                {showNetworkDropdown && selectedCoin && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className='custom-thin-scrollbar absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0a] shadow-lg'>
                    {selectedCoin.networks.length > 0 ? (
                      selectedCoin.networks.map((network) => (
                        <button
                          key={network.networkId}
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedNetwork(network)
                            setShowNetworkDropdown(false)
                          }}
                          className='flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-white/5'>
                          <span className='text-secondary text-sm font-medium'>{network.network}</span>
                        </button>
                      ))
                    ) : (
                      <div className='px-4 py-3 text-sm text-secondary'>{t('wallet.noNetworksAvailable')}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Address Input */}
            <div className='flex flex-col gap-1'>
              <label className='text-secondary text-sm font-medium'>{t('wallet.address')}</label>
              <input
                type='text'
                placeholder=''
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className='bg-card border-card rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-white placeholder:text-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary'
                required
              />
            </div>

            {/* Remark Input */}
            <div className='flex flex-col gap-1'>
              <label className='text-secondary text-sm font-medium'>{t('wallet.remarkOptional')}</label>
              <input
                type='text'
                value={remarkInput}
                onChange={(e) => setRemarkInput(e.target.value)}
                className='bg-card border-card rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-primary'
              />
            </div>

            <div className='flex items-stretch gap-2.5 pt-6'>
              <button 
                type='submit' 
                disabled={isSubmitting || !selectedCoin || !selectedNetwork || !addressInput.trim()}
                className='bg-brand flex-1 rounded-lg px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'>
                {isSubmitting ? t('wallet.adding') : t('wallet.save')}
              </button>
            </div>
          </form>
        </DialogShell>
      )}

      {/* Edit Address Dialog */}
      {showEditDialog && (
        <DialogShell title={t('wallet.editAddress')} close={() => setShowEditDialog(false)} mobilePosition='bottom'>
          <form className='flex flex-col gap-4' onSubmit={handleEditAddress}>
            {/* Coin Selection */}
            <div className='flex flex-col gap-1'>
              <label className='text-secondary text-sm font-medium'>{t('wallet.coin')}</label>
              <div className='relative'>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowNetworkDropdown(false) // Close network dropdown first
                    setShowCoinDropdown(!showCoinDropdown)
                  }}
                  className='border-card bg-card hover:bg-card/80 flex w-full items-center justify-between rounded-lg border border-white/10 px-4 py-3'>
                  <div className='flex items-center justify-center gap-2'>
                    {selectedCoin ? (
                      <>
                        {selectedCoin.logo && <img src={`${IMG_BASE_URL}${selectedCoin.logo}`} alt={selectedCoin.coinName} className='h-5 w-5' />}
                        <span className='text-secondary text-sm font-medium'>{selectedCoin.coinName}</span>
                      </>
                    ) : (
                      <span className='text-secondary/50 text-sm font-medium'>{t('wallet.selectCoin')}</span>
                    )}
                  </div>
                  <ChevronDown className='h-5 w-5 text-white' />
                </button>
                
                {showCoinDropdown && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className='custom-thin-scrollbar absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0a] shadow-lg'>
                    {isLoadingCoins ? (
                      <div className='px-4 py-3 text-sm text-secondary'>{t('wallet.loading')}</div>
                    ) : coins && coins.length > 0 ? (
                      coins.map((coin) => (
                        <button
                          key={coin.coinId}
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCoin(coin)
                            setSelectedNetwork(null) // Reset network when coin changes
                            setShowCoinDropdown(false)
                          }}
                          className='flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-white/5'>
                          {coin.logo && <img src={`${IMG_BASE_URL}${coin.logo}`} alt={coin.coinName} className='h-5 w-5' />}
                          <span className='text-secondary text-sm font-medium'>{coin.coinName}</span>
                        </button>
                      ))
                    ) : (
                      <div className='px-4 py-3 text-sm text-secondary'>{t('wallet.noCoinsAvailable')}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Network Selection */}
            <div className='flex flex-col gap-1'>
              <label className='text-secondary text-sm font-medium'>{t('wallet.network')}</label>
              <div className='relative'>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCoinDropdown(false) // Close coin dropdown first
                    setShowNetworkDropdown(!showNetworkDropdown)
                  }}
                  disabled={!selectedCoin}
                  className='border-card bg-card hover:bg-card/80 flex w-full items-center justify-between rounded-lg border border-white/10 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed'>
                  <div className='flex items-center justify-center gap-2'>
                    {selectedNetwork ? (
                      <span className='text-secondary text-sm font-medium'>{selectedNetwork.network}</span>
                    ) : (
                      <span className='text-secondary/50 text-sm font-medium'>{t('wallet.selectNetwork')}</span>
                    )}
                  </div>
                  <ChevronDown className='h-5 w-5 text-white' />
                </button>
                
                {showNetworkDropdown && selectedCoin && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className='custom-thin-scrollbar absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0a] shadow-lg'>
                    {selectedCoin.networks.length > 0 ? (
                      selectedCoin.networks.map((network) => (
                        <button
                          key={network.networkId}
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedNetwork(network)
                            setShowNetworkDropdown(false)
                          }}
                          className='flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-white/5'>
                          <span className='text-secondary text-sm font-medium'>{network.network}</span>
                        </button>
                      ))
                    ) : (
                      <div className='px-4 py-3 text-sm text-secondary'>{t('wallet.noNetworksAvailable')}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Address Input */}
            <div className='flex flex-col gap-1'>
              <label className='text-secondary text-sm font-medium'>{t('wallet.address')}</label>
              <input
                type='text'
                placeholder=''
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className='bg-card border-card rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-white placeholder:text-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary'
                required
              />
            </div>

            {/* Remark Input */}
            <div className='flex flex-col gap-1'>
              <label className='text-secondary text-sm font-medium'>{t('wallet.remarkOptional')}</label>
              <input
                type='text'
                value={remarkInput}
                onChange={(e) => setRemarkInput(e.target.value)}
                className='bg-card border-card rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-primary'
              />
            </div>

            <div className='flex items-stretch gap-2.5 pt-6'>
              <button 
                type='submit' 
                disabled={isSubmitting || !selectedCoin || !selectedNetwork || !addressInput.trim()}
                className='bg-brand flex-1 rounded-lg px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'>
                {isSubmitting ? t('wallet.saving') : t('wallet.save')}
              </button>
            </div>
          </form>
        </DialogShell>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedAddress && (
        <ConfirmDialog
          title={t('wallet.confirmDelete')}
          message={t('wallet.deleteAddressConfirm', {
            address: `${selectedAddress.address.slice(0, 6)}...${selectedAddress.address.slice(-4)}`,
            name: selectedAddress.remark || `${selectedAddress.network} - ${selectedAddress.coinName}`
          })}
          confirmText={t('wallet.delete')}
          cancelText={t('wallet.cancel')}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteDialog(false)}
          variant='danger'
        />
      )}
    </>
  )
}




